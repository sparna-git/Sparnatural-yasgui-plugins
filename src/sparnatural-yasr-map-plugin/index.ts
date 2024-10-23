import { drawSvgStringAsElement, SparnaturalPlugin, Yasr } from "../";
import { Plugin, DownloadInfo } from "../";

// /!\ black magic warning : dynamic leaflet import
// to avoid importing it twice in the page
var L:typeof import("leaflet/index");
var markerIcon;
if(window.L == undefined) {
    import("leaflet").then((theLeaflet) => {
        L = theLeaflet;
        window.L = L;
        import('leaflet.markercluster');
        markerIcon = L.icon( {
            iconUrl:require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png")
        } );
    });
} else {
    L = window.L;
    import('leaflet.markercluster');
    markerIcon = L.icon( {
        iconUrl:require("leaflet/dist/images/marker-icon.png"),
        shadowUrl: require("leaflet/dist/images/marker-shadow.png")
    } );
}
// /!\ end blackmagic

// Normal leaflet import :
// import L, { Marker } from "leaflet";
// import 'leaflet.markercluster'

import { Geometry, Point, Polygon } from "geojson";
import { wktToGeoJson } from "./wktParsing";
// CSS is required otherwise tiles are messed up
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// attempt to re-import Geoman, originally from Pascal
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
import { Branch, ISparJson } from "../ISparJson";
import { TableXResults } from "../TableXResults";

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
    searchedPolygon: {
        fillColor: string,
        weight: number,
        opacity: number,
        color: string,
        dashArray: string,
        fillOpacity: number
    },
    mapSize: {
        width:string,
        height:string
    }
    setView: {
        center: L.LatLngExpression,
        zoom?: number,
        options?: L.ZoomPanOptions
    }
    parsingFunction: (literalValue:string)=> Geometry,
    L18n: {
        warnFindNoCoordinate: string, // use "<count>" patern to replace with count of results with no geo coordinates
        warnFindNoCoordinateBtn: string // Link label for plugin table display on warnig message
    }
    
}

// represents a yasr result cell with a geo literal
interface GeoCell {
    cellValue: Parser.BindingValue, // literal value of the cell
    variable:string, // variable of the cell
    parsedLit?: Geometry,
    area?: number,
}


export class MapPlugin implements SparnaturalPlugin<PluginConfig>{

    priority: number = 5; // priority for sorting the plugins in yasr
    private yasr:Yasr
    private mapEL:HTMLElement | null = null; //HTMLElement of the map
    private warnEL:HTMLElement | null = null; //HTMLElement of Warning message if results with no geo coordinates.
    private map:L.Map | null = null
    private config: PluginConfig;
    // private markerCluster:L.MarkerClusterGroup;
    private markerCluster:any;
    private layerGroups:{[key:string]:L.LayerGroup} = {} // group all polygons with sparql var name as key
    private controlLayers: L.Control.Layers | null = null // responsible for filterable layers on the map
    private colorsUsed:Array<number> = [] // used to color the polygons
    private layers: Array<L.Layer> = [] // contains all layers (Marker | Polygon)
    hideFromSelection?: boolean = false;
    label?: string = 'Map';
    options?: PluginConfig;
    haveResultWithoutGeo: number = 0 ;
    bounds: any; // Instantiate LatLngBounds object
    sparnaturalQuery: ISparJson | null = null ;
    specProvider: any;
    layerGroupsLabels: Array<any> = [];

    private results?: TableXResults;

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
        searchedPolygon: {
            fillColor: 'transparent',
            weight: 2,
            opacity: 1,
            color: 'gray',
            dashArray: '10',
            fillOpacity: 0
        },
        mapSize: {
            width:'auto',
            height:'550px',
        },
        setView: {
            center:[46.20222, 6.14569], // Geneva, Switzerland
            zoom: 11,
            options: undefined
        },
        parsingFunction: wktToGeoJson,
        L18n: {
            warnFindNoCoordinate: 'Attention, des résultats (<count>) n\'ont pas de coordonnées pour être représentés sur la carte.',
            warnFindNoCoordinateBtn: 'Afficher la table des résultats' 
        }
        
    }

    constructor(yasr:Yasr){
        this.yasr = yasr;
        // merge options when set by client
        
        if(MapPlugin.defaults.markerOptions) L.Marker.mergeOptions(MapPlugin.defaults.markerOptions)
        if(MapPlugin.defaults.polylineOptions) L.Marker.mergeOptions(MapPlugin.defaults.polylineOptions)
        this.config = MapPlugin.defaults
        this.markerCluster = L.markerClusterGroup()
        //this.controlLayers = L.control.layers()
        /*this.yasr?.rootEl.addEventListener("sparnaturalQueryChange", (e) => {
            this.initDrawSearchAreas() ;
        });*/
    }

    // Map plugin can handle results in the form of geosparql wktLiterals
    // http://schemas.opengis.net/geosparql/1.0/geosparql_vocab_all.rdf#wktLiteral
    canHandleResults(): boolean {
        let tableXResults:TableXResults = new TableXResults(this.yasr.results as Parser);
        let have_geo = false ;
        this.haveResultWithoutGeo = 0;
        if(tableXResults && tableXResults.getBindings().length > 0){
            tableXResults.getBindings().some((row: Parser.Binding)=>{ // if a cell contains a geosparql value
                if(this.getGeosparqlValue(row)){
                    have_geo =  true
                } else {
                    this.haveResultWithoutGeo++ ;
                }
            })
        }

        
        // also see cases where we have a latitude and longitude columns
        if(!have_geo) {
            if(
                this.sparnaturalQuery
                &&
                MapPlugin.getLatitudeColumn(tableXResults, this.sparnaturalQuery)
                &&
                MapPlugin.getLongitudeColumn(tableXResults, this.sparnaturalQuery)
            ) {
                return true;
            }
        }

        return have_geo ;
    }

    private static getLatitudeColumn(tableXResults:TableXResults, query:ISparJson):string|undefined {
        if(!query) return;
        // analyze the predicate of each column
        for(let i in tableXResults.getVariables()) {
            let varName = tableXResults.getVariables()[i]
            let property = MapPlugin.getVariablePredicateRec(query, varName);
            if(
                // property == "https://schema.org/latitude"
                // ||
                // property == "http://www.w3.org/2003/01/geo/wgs84_pos#lat"
                property
                &&
                property?.toLowerCase().indexOf("lat") > -1
            ) {
                return varName;
            }
        }
    }

    private static getLongitudeColumn(tableXResults:TableXResults, query:ISparJson):string|undefined {
        if(!query) return;
        // analyze the predicate of each column
        for(let i in tableXResults.getVariables()) {
            let varName = tableXResults.getVariables()[i]
            let property = MapPlugin.getVariablePredicateRec(query, varName);
            
            if(
                // property == "https://schema.org/longitude"
                // ||
                // property == "http://www.w3.org/2003/01/geo/wgs84_pos#long"
                property
                &&
                property?.toLowerCase().indexOf("long") > -1
            ) {
                return varName;
            }
        }
    }

    private static getVariablePredicateRec(query:ISparJson|Branch, varName:string):string|undefined {
        let branchWithVar:Branch|undefined = MapPlugin.findBranchWithObjectVar(query,varName);
        if(branchWithVar) {
            return branchWithVar.line.p;
        }
    }

    private static findBranchWithObjectVar(query:ISparJson|Branch, varName:string):Branch|undefined {
        if(query["branches"]) {
            for (let index = 0; index < (query as ISparJson).branches.length; index++) {
                const branch = (query as ISparJson).branches[index];
                let result = MapPlugin.findBranchWithObjectVar(branch, varName);
                if(result) return result;
            }
        } else {
            if ((query as Branch).line.o == varName) {
                return (query as Branch);
            } else {
                for (let index = 0; index < (query as Branch).children.length; index++) {
                    const branch = (query as Branch).children[index];
                    let result = MapPlugin.findBranchWithObjectVar(branch, varName);
                    if(result) return result;
                }
            }
        }
    }


    /**
     * @param row a binding set
     * @returns an array of GeoCell objects containing the literal value and column index, for each column having a geo datatype
     */
    private getGeosparqlValue(row:Parser.Binding): GeoCell[] | null {
        console.log("getGeosparqlValue")
        let geoLiterals:Array<GeoCell> = []
        for (var key in row) {
            let cell = row[key];
            if(this.isBindingValue(cell)){
                if(this.isGeoValue(cell)){
                    // cell contains a geoliteral
                    geoLiterals.push({cellValue:cell, variable:key})
                } else if(this.sparnaturalQuery) {
                    let property = MapPlugin.getVariablePredicateRec(this.sparnaturalQuery, key)  
                    console.log(property)
                    if(property && property.toLowerCase().indexOf("lat") > -1) {
                        // find the longitude key
                        var longKey:string|undefined = undefined
                        for (var anotherKey in row) {
                            let anotherProperty = MapPlugin.getVariablePredicateRec(this.sparnaturalQuery, anotherKey) 
                            if(anotherProperty && anotherProperty.toLowerCase().indexOf("long") > -1) {
                                console.log("found longKey"+longKey)
                                longKey = anotherKey
                            }

                            if(longKey) {
                                // we fake a wktLiteral
                                geoLiterals.push({
                                    cellValue: {
                                        value:"POINT("+row[longKey].value+" "+cell.value+")",
                                        type:"literal",
                                        datatype:"http://www.opengis.net/ont/geosparql#wktLiteral"
                                    },
                                    variable:key
                                })
                            }
                        }
                    }
                }
            }
        }
        if(geoLiterals.length > 0 ) return geoLiterals
        return null
    }

    private isGeoValue(cell:Parser.BindingValue):boolean {
        let isGeoSparql = this.config.geoDataType.includes(cell.datatype as string);
        return isGeoSparql;
    }

    draw(persistentConfig: any, runtimeConfig?: any): void | Promise<void> {

        this.results = new TableXResults(this.yasr.results as Parser);
        //if the resultset changed, then cleanup and rerender
        this.cleanUp()
        this.createMap();

        let geo_rows: {
            [variable:string]: Array<GeoCell>   
        } = {};
        this.layerGroupsLabels = Array() ;

        this.results.getBindings().forEach((row:Parser.Binding)=>{ 
            const geoCells =  this.parseGeoLiteral(row,this.config.parsingFunction)
            // features are in this case either GeoJson Point or Polygons
            if(geoCells.length === 0) { 
                return
            }

            return geoCells.map(geoCell=>{
                let popUpString = this.createPopUpString(row)
                if(geoCell.parsedLit?.type === "Point") this.drawMarker(geoCell.parsedLit,geoCell.variable,popUpString)
                if(geoCell.parsedLit?.type === "Polygon")  {
                    // compute Polygon area and store it
                    let area:number = this.polygonArea(geoCell.parsedLit?.coordinates) ;
                    let rowObject = {
                        cellValue: geoCell.cellValue,
                        parsedLit: geoCell.parsedLit,
                        variable: geoCell.variable,
                        popUpString: popUpString, 
                        area: area
                    }
                    if (geo_rows[geoCell.variable] == undefined) {
                        geo_rows[geoCell.variable] = Array()  ;
                    }
                    geo_rows[geoCell.variable].push(rowObject) ;
                }
            })
        });

        // prepare the polygons to draw
        let layersRows: Array<any>[] = [];
        for (var key in geo_rows) {
            if (geo_rows[key]) {
                console.log(key)
                let colIndexArray = geo_rows[key] ;
                let sortedArray: GeoCell[] = colIndexArray.sort((n1, n2) => {
                    if(n2.area && n1.area) {
                        return n2.area - n1.area ;
                    } else {
                        // will never happen
                        return -1;
                    }
                });
                geo_rows[key] = sortedArray ;

                let it = 0;
                let max = 50;
                let itLayer = 0;
                layersRows = [];

                for(let ir = 0; ir < geo_rows[key].length; ir++){
                    if(it > max-1) {
                        it = 0 ;
                        itLayer++;
                    }
                    
                    if (layersRows[itLayer] == undefined) {
                        layersRows[itLayer] = Array()  ;
                    }
                    layersRows[itLayer].push(geo_rows[key][ir]) ;
                    it++;
                }
                const cols = this.results?.getVariables();
                for(let ir = 0; ir < layersRows.length; ir++){
                    let colIndex = layersRows[ir][0].colIndex
                    let vName = cols[colIndex]+'_'+ir ;
                    let last_item_key = layersRows[ir].length - 1;
                    let max_area = layersRows[ir][0].area+' km²' ;
                    let min_area = layersRows[ir][last_item_key].area+' km²' ;
                    this.layerGroupsLabels[vName] = min_area+' - ' +max_area ;
                } 
            }
        }
        // draaaow the polygons
        for(let i = 0; i < layersRows.length; i++){
            for(let ir = 0; ir < layersRows[i].length; ir++){
                if(layersRows[i]) {
                    let data = layersRows[i][ir] ;
                    this.drawPoly(data.parsedLit,data.colIndex,data.popUpString, i)
                }
            }
        }
        
        // If the markers are clustered then draw the cluster now
        if(!this.map) throw Error(`Couldn't find map element`)
        // add all the layers created in addControlLayer
        let controlsLayersObjs = {} ;
        for (const [k,v] of Object.entries(this.layerGroups)) {
            let label = this.layerGroupsLabels[k] ;
            //this.controlLayers?.addOverlay(v,label)
            controlsLayersObjs[label] = v ;
            v.addTo(this.map) ;
        }
        
        this.controlLayers = L.control.layers({}, controlsLayersObjs, {collapsed: false}) ;

        this.controlLayers?.addTo(this.map)
        // add cluster of markers
        this.markerCluster.addTo(this.map)
        // when a popup gets rendered then attach listener
        this.map.on('popupopen', (e)=> {
            const el = e.popup.getElement()
            if(!el) return
            this.addIriClickListener(el)
          });
          
          this.initDrawSearchAreas();

          this.map.fitBounds(this.bounds) ;
    }
    private calcBounds(coordinates) {
        if (this.bounds) {
            this.bounds.extend(coordinates) ;
        } else {
            this.bounds = L.latLngBounds(coordinates) // Instantiate LatLngBounds object
        }
    }

    public notifyQuery(sparnaturalQuery:ISparJson) {
        this.sparnaturalQuery = sparnaturalQuery ;
	}

    public notifyConfiguration(specProvider:any) {
		this.specProvider = specProvider;
	}

    private searchCoordinatesOnQuery(data) {
        var result: any = []
        const iterate = (obj) => {
            if (!obj) {
                return;
            }
            Object.keys(obj).forEach(key => {
                var value = obj[key]
                if (typeof value === "object" && value !== null) {
                    iterate(value)
                    if (value.coordinates) {
                        result.push(value);
                    } 
                }
            })
        }
        iterate(data)
        return result;
    }

    private initDrawSearchAreas() {
        if ((this.map == null) || (this.sparnaturalQuery == null)) {
            return false ;
        } else {
            let searchareas: any = this.searchCoordinatesOnQuery(this.sparnaturalQuery) ;
            let arrayPolygones: any = [] ;
            for(let i = 0; i < searchareas.length; i++){
                let coordonnees = searchareas[i].coordinates[0] ;
                let latlongs: Array<string> = [] ;
                
                for(let ic = 0; ic < coordonnees.length; ic++){
                    let latLon: any = [coordonnees[ic].lat, coordonnees[ic].lng]
                    latlongs.push(latLon) ;
                }
                arrayPolygones.push(latlongs) ;
            }
            this.drawSearchAreas(arrayPolygones) ;
        }
        
    }

    private drawSearchAreas(searchareas) {
        if ((this.map == null) || (this.sparnaturalQuery == null)) {
            return false ;
        }
        for(let i = 0; i < searchareas.length; i++){
            this.drawSearchPoly(searchareas[i]) ;
        }
    }

    private drawSearchPoly(feature: any) {
        if(!this.map) throw Error(`Wanted to draw Polygon but no map found`)
        // configuration of Polygon see: https://leafletjs.com/reference.html#polygon
        let searchedPolygon:any = {}
        let polyOptions: any = [] ;
        polyOptions = this.config.searchedPolygon ;
        const poly = new L.Polygon(feature as L.LatLngExpression[][], polyOptions)
        this.layerGroups['searchPoly'] ? this.layerGroups['searchPoly'].addLayer(poly) : this.layerGroups['searchPoly'] = L.layerGroup([poly]);
        poly.addTo(this.map).bringToBack();
        this.calcBounds(feature) ;
    }

    private drawMarker(feature: Point,variabel:string, popUpString:string) {
        const latLng = new L.LatLng(feature.coordinates[1],feature.coordinates[0])
        if(!this.map) throw Error(`Wanted to draw Marker but no map found`)
        let markerOptions:any ={
            // markerIcon is the global variable initialized with dynamic import
            icon:markerIcon
        }
        if(this.config.markerOptions) markerOptions = this.config.markerOptions
        const marker = new L.Marker(latLng, markerOptions).bindPopup(popUpString)

        this.addToLayerList(marker)
        //if clustering is activated, then don't draw the marker but gather it in the cluster
        this.markerCluster.addLayer(marker)

        this.calcBounds(latLng) ;
    }

    private drawPoly(feature: Polygon,colIndex:number, popUpString:string, layerIndex:number) {
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
        polyOptions['fillOpacity'] = 0.1 // background opacity
        polyOptions['fillOpacity'] = 0.05 // background opacity
        polyOptions['weight'] = 1 // stroke width
        
        
        // add controll layers for columns
        feature.coordinates[0].map((item)=>{
            item.reverse()
         })

        const poly = new L.Polygon(feature.coordinates as L.LatLngExpression[][], polyOptions).bindPopup(popUpString) 
        this.addToLayerList(poly)
        this.addToLayerGroup(colIndex,poly, layerIndex)
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
    private addToLayerGroup(colIndex:number,feature:L.Polygon | L.Marker, layerIndex:any = null){
        const cols = this.results?.getVariables()
        if(cols){
            let vName = cols[colIndex] ;

            if(layerIndex != null) {
                vName = cols[colIndex]+'_'+layerIndex ;
            } 
           
            this.layerGroups[vName] ? this.layerGroups[vName].addLayer(feature) : this.layerGroups[vName] = L.layerGroup([feature])
        }
    }

    private createPopUpString(row:Parser.Binding):string {
        let popUp:{[key: string]: any;} = {}
        let columns = this.results?.getVariables()
        
        for (var key in row) {
            let cell = row[key];
            if(
                this.isBindingValue(cell)
                &&
                ! this.config.geoDataType.includes(cell.datatype as string)
                &&
                columns
            ){
                // store the whole cell in the popup
                popUp[key] = cell
            }
        }

        let contentString = ``
        for (const [k, cell] of Object.entries(popUp)) {
            let currentString = `<strong>${k}</strong>:&nbsp;`;
            
            // normal URI : a clickable URI
            if(cell.type === "uri") {
                currentString += ` <a class='iri' style="cursor: pointer; color:blue;" href="${cell.value}" target="_blank">${cell.value}</a>`
            // TableXResult special case containing URI + label : clickable URI with label displayed
            } else if(cell.type === "x-labelled-uri") {
                currentString += ` <a class='iri' style="cursor: pointer; color:blue;" href="${cell.value}" target="_blank">${cell.label}</a>`
            // other case : just print the value (the literal)
            } else {
                currentString += `${cell.value}`
            }
            currentString += "<br />";
            contentString += currentString;
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
            let text = this.config.L18n.warnFindNoCoordinate.replace("<count>", this.haveResultWithoutGeo.toString())
            this.warnEL.innerText = text;

            parentEl.appendChild(this.warnEL) ;
            let linkToTable = document.createElement('a');
            linkToTable.classList.add('link', 'ms-2');
            linkToTable.setAttribute('style', "cursor: pointer;");
            linkToTable.innerText = this.config.L18n.warnFindNoCoordinateBtn ;
            this.warnEL.appendChild(linkToTable) ;
            linkToTable.addEventListener("click", ()=>{
                (this.yasr as any).selectPlugin("table") ;
                return false;
            });
        }

        
        
        // Create the map HTMLElement
        this.mapEL = document.createElement('div')
        this.mapEL.setAttribute('id','yasrmap')
        this.mapEL.style.height = this.config.mapSize.height
        this.mapEL.style.width = this.config.mapSize.width

        
        if(!parentEl) throw Error(`Couldn't find parent element of Yasr. No element found with Id: resultsId1`)
        parentEl.appendChild(this.mapEL)
        this.map = L.map('yasrmap').setView(this.config.setView.center,this.config.setView.zoom,this.config.setView.options);
        if(this.map != null) {
            this.map.options.maxZoom = 19 // see: https://github.com/Leaflet/Leaflet.markercluster/issues/611
        }
        // For each provided baseLayer create a tileLayer and add it to control
        this.config.baseLayers.map((l,index)=>{
            let name = 'No attribution name provided'
            if(l.options?.attribution) name = l.options.attribution 
            const layer = L.tileLayer(l.urlTemplate,l.options)
            if(index === 0 && this.map) layer.addTo(this.map) // set first base layer as active
            //this.controlLayers?.addBaseLayer(layer,name) 
        })

    }
    
    getIcon(): Element {
        return drawSvgStringAsElement(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M408 120C408 174.6 334.9 271.9 302.8 311.1C295.1 321.6 280.9 321.6 273.2 311.1C241.1 271.9 168 174.6 168 120C168 53.73 221.7 0 288 0C354.3 0 408 53.73 408 120zM288 152C310.1 152 328 134.1 328 112C328 89.91 310.1 72 288 72C265.9 72 248 89.91 248 112C248 134.1 265.9 152 288 152zM425.6 179.8C426.1 178.6 426.6 177.4 427.1 176.1L543.1 129.7C558.9 123.4 576 135 576 152V422.8C576 432.6 570 441.4 560.9 445.1L416 503V200.4C419.5 193.5 422.7 186.7 425.6 179.8zM150.4 179.8C153.3 186.7 156.5 193.5 160 200.4V451.8L32.91 502.7C17.15 508.1 0 497.4 0 480.4V209.6C0 199.8 5.975 190.1 15.09 187.3L137.6 138.3C140 152.5 144.9 166.6 150.4 179.8H150.4zM327.8 331.1C341.7 314.6 363.5 286.3 384 255V504.3L192 449.4V255C212.5 286.3 234.3 314.6 248.2 331.1C268.7 357.6 307.3 357.6 327.8 331.1L327.8 331.1z"/></svg>`)
    }
    helpReference?: string | undefined;

    // cb: parsing function which takes a string and translates it to a geoJSON geometry
    private parseGeoLiteral(row:Parser.Binding, cb:( literal:string)=>Geometry):Array<GeoCell>{
        const geoLiterals = this.getGeosparqlValue(row)
        if(!geoLiterals) return []
        return geoLiterals.map((lit:GeoCell)=>{
            lit.parsedLit = cb(lit.cellValue.value) // let callback do the parsing
            return lit
        })
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

    
  private polygonArea(coords: any) {
    let total = 0;
    let arrayCoords = new Array()  ;
    arrayCoords[0] = new Array()  ;
    let index = 0 ;
    coords[0].forEach((point:any) => {
      let newSet = [point[0], point[1]];
      arrayCoords[0][index] = newSet ; 

      index++;
    });

    if (arrayCoords && arrayCoords.length > 0) {
      total += Math.abs(this.ringArea(arrayCoords[0]));
      for (let i = 1; i < arrayCoords.length; i++) {
        total -= Math.abs(this.ringArea(arrayCoords[i]));
      }
      
    }
    return Math.round(total) ;
  }

  private ringArea(coords: number[][]): number {
    const coordsLength = coords.length;
    const earthRadius = 6371008.8/1000; //km²
    const FACTOR = (earthRadius * earthRadius) / 2;
    const PI_OVER_180 = Math.PI / 180;
  
    if (coordsLength <= 2) return 0;
    let total = 0;
  
    let i = 0;
    while (i < coordsLength) {
      const lower = coords[i];
      const middle = coords[i + 1 === coordsLength ? 0 : i + 1];
      const upper =
        coords[i + 2 >= coordsLength ? (i + 2) % coordsLength : i + 2];
  
      const lowerX = lower[0] * PI_OVER_180;
      const middleY = middle[1] * PI_OVER_180;
      const upperX = upper[0] * PI_OVER_180;
  
      total += (upperX - lowerX) * Math.sin(middleY);
  
      i++;
    }
    return total * FACTOR;
  }

}
