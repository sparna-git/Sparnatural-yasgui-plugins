import { drawSvgStringAsElement, Yasr } from "../";
import { Plugin, DownloadInfo } from "../";
import L, { Marker } from "leaflet";
//import * as L from "leaflet";
import { Geometry, Point, Polygon } from "geojson";
import { wktToGeoJson } from "./wktParsing";
// CSS is required otherwise tiles are messed up
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
/*
  Importing Geoman-io here because it is used by Sparnatural. If I don't import it. then opening the map in sparnatural crashes.
  It then doesn't init the map.pm attribute. (stays undefined) and when it tries to call map.pm.optIn it says undefined
*/
// import "@geoman-io/leaflet-geoman-free";
// import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
// Bug in rendering markers.
// see: https://github.com/PaulLeCam/react-leaflet/issues/453
// import customIcon from 'leaflet/dist/images/marker-icon.png';
// import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import Parser from "../parsers";
const markerIcon = L.icon( {
    iconUrl:require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png")
} );

/*
    Currently this plugin supports only the wktLiteral parsing.
    If you would like to add further parsing like GML or KML, just implement a serializer callback for parseGeoLiteral()
*/

interface PluginConfig {
    baseLayers: Array<{
        urlTemplate: string, 
        options?: L.TileLayerOptions
    }>
    polylineOptions: L.PolylineOptions | null,
    markerOptions: L.MarkerOptions | null,
    geoDataType: Array<string>,
    polygonDefaultColor: string,
    polygonColors: Array<string>,
    mapSize: {
        width:string,
        height:string
    }
    setView: {
        center: L.LatLngExpression,
        zoom?: number,
        options?: L.ZoomPanOptions
    }
    parsingFunction: (literalValue:string)=> Geometry
}

// represents a yasr result cell with a geo literal
interface GeoCell {
    cellValue: Parser.BindingValue, // literal value of the cell
    colIndex:number, // column index of the cell
    parsedLit?: Geometry
}

type DataRow = [number, ...(Parser.BindingValue | "")[]];


export class MapPlugin implements Plugin<PluginConfig>{
    priority: number = 5; // priority for sorting the plugins in yasr
    private yasr:Yasr
    private mapEL:HTMLElement | null = null; //HTMLElement of the map
    private warnEL:HTMLElement | null = null; //HTMLElement of Warning message if results with no geo coordinates.
    private map:L.Map | null = null
    private config: PluginConfig;
    private markerCluster:L.MarkerClusterGroup;
    private layerGroups:{[key:string]:L.LayerGroup} = {} // group all polygons with sparql var name as key
    private controlLayers: L.Control.Layers | null = null // responsible for filterable layers on the map
    private colorsUsed:Array<number> = [] // used to color the polygons
    private layers: Array<L.Layer> = [] // contains all layers (Marker | Polygon)
    hideFromSelection?: boolean = false;
    label?: string = 'Map';
    options?: PluginConfig;
    haveResultWithoutGeo: number = 0 ;
    bounds: any; // Instantiate LatLngBounds object

    // define the default config for leaflet
    public static defaults: PluginConfig = {
        baseLayers: [{
            urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            options: {
                maxZoom: 19,
                attribution: "© OpenStreetMap"
            }}],
        geoDataType: ['http://www.opengis.net/ont/geosparql#wktLiteral', 'http://www.openlinksw.com/schemas/virtrdf#Geometry'], // add here further type such as 'http://www.opengis.net/ont/gml'
        polylineOptions: null,
        markerOptions: null,
        polygonDefaultColor: 'blue',
        polygonColors: [
            'black',
            'green',
            'orange',
            'blue',
            'purple',
            'red',
        ],
        mapSize: {
            width:'auto',
            height:'550px',
        },
        setView: {
            center:[46.20222, 6.14569], // Geneva, Switzerland
            zoom: 11,
            options: undefined
        },
        parsingFunction: wktToGeoJson
        
    }

    constructor(yasr:Yasr){
        this.yasr = yasr;
        // merge options when set by client
        
        if(MapPlugin.defaults.markerOptions) L.Marker.mergeOptions(MapPlugin.defaults.markerOptions)
        if(MapPlugin.defaults.polylineOptions) L.Marker.mergeOptions(MapPlugin.defaults.polylineOptions)
        this.config = MapPlugin.defaults
        this.markerCluster = L.markerClusterGroup()
        this.controlLayers = L.control.layers()
    }

    // Map plugin can handle results in the form of geosparql wktLiterals
    // http://schemas.opengis.net/geosparql/1.0/geosparql_vocab_all.rdf#wktLiteral
    canHandleResults(): boolean {
        let rows = this.getRows()
        let have_geo = false ;
        this.haveResultWithoutGeo = 0;
        if(rows && rows.length > 0){
            rows.some((row: DataRow)=>{ // if a cell contains a geosparql value
                if(this.getGeosparqlValue(row)){
                    have_geo =  true
                } else {
                    this.haveResultWithoutGeo++ ;
                }
            })
        }
        return have_geo ;
    }

    // this method checks if there is a geosparql value in a cell for a given row
    private getGeosparqlValue(row:DataRow): GeoCell[] | null {
        let geoLiterals:Array<GeoCell> = []
        row.forEach((cell,index)=>{
            if(this.isBindingValue(cell)){
               if(this.config.geoDataType.includes(cell.datatype as string)){
                // cell contains a geoliteral
                geoLiterals.push({cellValue:cell,colIndex:index-1})
               }
            }
            return false
        });
        if(geoLiterals.length > 0 ) return geoLiterals
        return null
    }

    draw(persistentConfig: any, runtimeConfig?: any): void | Promise<void> {
        const rows = this.getRows()
        //if the resultset changed, then cleanup and rerender
        this.cleanUp()
        this.createMap()

        
        const drawables = rows.flatMap((row:DataRow)=>{ 
            const geoCells =  this.parseGeoLiteral(row,this.config.parsingFunction)
            // features are in this case either GeoJson Point or Polygons
            if(geoCells.length === 0) return
            return geoCells.map(c=>{
                let popUpString = this.createPopUpString(row)
                if(c.parsedLit?.type === "Point") this.drawMarker(c.parsedLit,c.colIndex,popUpString)
                if(c.parsedLit?.type === "Polygon") this.drawPoly(c.parsedLit,c.colIndex,popUpString)
            })
        })
        // If the markers are clustered then draw the cluster now
        if(!this.map) throw Error(`Couldn't find map element`)
        // add all the layers created in addControlLayer
        for (const [k,v] of Object.entries(this.layerGroups)) {
            this.controlLayers?.addOverlay(v,k)
        }
        
        this.controlLayers?.addTo(this.map)
        // add cluster of markers
        this.markerCluster.addTo(this.map)
        // when a popup gets rendered then attach listener
        this.map.on('popupopen', (e)=> {
            const el = e.popup.getElement()
            if(!el) return
            this.addIriClickListener(el)
          });

          this.map.fitBounds(this.bounds) ;
    }
    private calcBounds(coordinates) {
        if (this.bounds) {
            this.bounds.extend(coordinates) ;
        } else {
            this.bounds = L.latLngBounds(coordinates) // Instantiate LatLngBounds object
        }
    }

    private drawMarker(feature: Point,colIndex:number, popUpString:string) {
        const latLng = new L.LatLng(feature.coordinates[1],feature.coordinates[0])
        if(!this.map) throw Error(`Wanted to draw Marker but no map found`)
        let markerOptions:any ={
            icon:markerIcon
        }
        if(this.config.markerOptions) markerOptions = this.config.markerOptions
        const marker = new L.Marker(latLng, markerOptions).bindPopup(popUpString)

        this.addToLayerList(marker)
        //if clustering is activated, then don't draw the marker but gather it in the cluster
        this.markerCluster.addLayer(marker)

        this.calcBounds(latLng) ;
    }

    private drawPoly(feature: Polygon,colIndex:number, popUpString:string) {
        console.log('el')
        if(!this.map) throw Error(`Wanted to draw Polygon but no map found`)
        // configuration of Polygon see: https://leafletjs.com/reference.html#polygon
        let polyOptions:any = {}
        if(this.config.polylineOptions) polyOptions = this.config.polylineOptions
        if(this.colorsUsed.includes(colIndex)){
            polyOptions['color'] = this.config.polygonColors[this.colorsUsed.indexOf(colIndex)]
        }else{
            this.colorsUsed.push(colIndex)
            polyOptions['color'] = this.config.polygonColors[this.colorsUsed.indexOf(colIndex)]
        }
        //polyOptions['color'] = 'red';
        polyOptions['fill'] = true // no color filled in polygon
        polyOptions['opacity'] = 0.4 // stroke opacity
        // add controll layers for columns
        feature.coordinates[0].map((item)=>{
            item.reverse()
         })

        const poly = new L.Polygon(feature.coordinates as L.LatLngExpression[][], polyOptions).bindPopup(popUpString) 
        this.addToLayerList(poly)
        this.addToLayerGroup(colIndex,poly)
        poly.addTo(this.map);

        this.calcBounds(feature.coordinates[0]) ;
    }

    private addIriClickListener(el: HTMLElement){

        const iriElements = el.getElementsByClassName('iri')
        for(let i = 0; i < iriElements.length; i++){
            let el = iriElements[i] as HTMLAnchorElement
            el.addEventListener('click',()=>{
                el.dispatchEvent( new CustomEvent('YasrIriClick',{bubbles:true,detail:el.text}))
            })
        }
    }

    // Add the drawable to a control layer
    private addToLayerGroup(colIndex:number,feature:L.Polygon | L.Marker){
        const cols = this.getVariables()
        if(cols){
            let vName = cols[colIndex]
            this.layerGroups[vName] ? this.layerGroups[vName].addLayer(feature) : this.layerGroups[vName] = L.layerGroup([feature])
        }
    }

    private createPopUpString(row:DataRow):string {
        let popUp:{[key: string]: any;} = {}
        let columns = this.getVariables()
        row.forEach((cell,i)=>{
            if(i === 0) popUp['rowNr'] = cell as number
            if(this.isBindingValue(cell)){
                if(!columns) return
                if(cell.type === 'uri') popUp[columns[i]] = cell.value
            }
        })
        let contentString = ``
        for (const [k, v] of Object.entries(popUp)) {
            contentString = `${contentString} <br> ${k}: <a class='iri' style="cursor: pointer; color:blue;">${v}</a>`
        }
        return contentString
    }

    private createMap(){
        // Create the map HTMLElement

        // Append map to YASR result HTMLElement and init
        const parentEl = document.getElementById('resultsId1')
        if(!parentEl) throw Error(`Couldn't find parent element of Yasr. No element found with Id: resultsId1`)
        

        if(this.haveResultWithoutGeo > 0) {

            this.warnEL = document.createElement('div')
            this.warnEL.setAttribute('id','yasrmap-warnEL')
            this.warnEL.setAttribute('class','alert alert-warning')
            this.warnEL.innerText ='Attention, des résultats ('+this.haveResultWithoutGeo+') n\'ont pas de coordonnées pour être représentés sur la carte' ;

            parentEl.appendChild(this.warnEL) ;
        }
        
        
        // Create the map HTMLElement
        this.mapEL = document.createElement('div')
        this.mapEL.setAttribute('id','yasrmap')
        this.mapEL.style.height = this.config.mapSize.height
        this.mapEL.style.width = this.config.mapSize.width

        
        if(!parentEl) throw Error(`Couldn't find parent element of Yasr. No element found with Id: resultsId1`)
        parentEl.appendChild(this.mapEL)
        this.map = L.map('yasrmap').setView(this.config.setView.center,this.config.setView.zoom,this.config.setView.options)
        this.map.options.maxZoom = 19 // see: https://github.com/Leaflet/Leaflet.markercluster/issues/611
        // For each provided baseLayer create a tileLayer and add it to control
        this.config.baseLayers.map((l,index)=>{
            let name = 'No attribution name provided'
            if(l.options?.attribution) name = l.options.attribution 
            const layer = L.tileLayer(l.urlTemplate,l.options)
            if(index === 0 && this.map) layer.addTo(this.map) // set first base layer as active
            this.controlLayers?.addBaseLayer(layer,name) 
        })

    }
    
    getIcon(): Element {
        return drawSvgStringAsElement(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M408 120C408 174.6 334.9 271.9 302.8 311.1C295.1 321.6 280.9 321.6 273.2 311.1C241.1 271.9 168 174.6 168 120C168 53.73 221.7 0 288 0C354.3 0 408 53.73 408 120zM288 152C310.1 152 328 134.1 328 112C328 89.91 310.1 72 288 72C265.9 72 248 89.91 248 112C248 134.1 265.9 152 288 152zM425.6 179.8C426.1 178.6 426.6 177.4 427.1 176.1L543.1 129.7C558.9 123.4 576 135 576 152V422.8C576 432.6 570 441.4 560.9 445.1L416 503V200.4C419.5 193.5 422.7 186.7 425.6 179.8zM150.4 179.8C153.3 186.7 156.5 193.5 160 200.4V451.8L32.91 502.7C17.15 508.1 0 497.4 0 480.4V209.6C0 199.8 5.975 190.1 15.09 187.3L137.6 138.3C140 152.5 144.9 166.6 150.4 179.8H150.4zM327.8 331.1C341.7 314.6 363.5 286.3 384 255V504.3L192 449.4V255C212.5 286.3 234.3 314.6 248.2 331.1C268.7 357.6 307.3 357.6 327.8 331.1L327.8 331.1z"/></svg>`)
    }
    helpReference?: string | undefined;

    // cb: parsing function which takes a string and translates it to a geoJSON geometry
    private parseGeoLiteral(row:DataRow, cb:( literal:string)=>Geometry):Array<GeoCell>{
        const literals = this.getGeosparqlValue(row)
        if(!literals) return []
        return literals.map((lit:GeoCell)=>{
            lit.parsedLit = cb(lit.cellValue.value) // let callback do the parsing
            return lit
        })
    }

    private getRows(): DataRow[] {
        if (!this.yasr.results) return [];
        const bindings = this.yasr.results.getBindings();
        if (!bindings) return [];
        // Vars decide the columns
        const vars = this.yasr.results.getVariables();
        // Use "" as the empty value, undefined will throw runtime errors
        return bindings.map((binding, rowId) => [rowId + 1, ...vars.map((variable) => binding[variable] ?? "")]);
    }

    private getVariables(){
        return this.yasr.results?.getVariables()
    }
    
    // remove the already rendered map so we can rerender it
    private cleanUp() {
        this.mapEL?.remove()
        this.warnEL?.remove()
        this.layerGroups = {}
        this.markerCluster = L.markerClusterGroup()
        this.controlLayers = L.control.layers()
        this.colorsUsed = []
        this.bounds = false ;
    }

    private addToLayerList(g: L.Layer){
        this.layers.push(g)
    }

    // see: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
    private isBindingValue(cell: number | "" | Parser.BindingValue): cell is Parser.BindingValue {
        if(cell === '') return false
        if(typeof cell === 'number') return false
        return ('value' in cell && (('type' in cell) || ('datatype' in cell)))
      }

}
