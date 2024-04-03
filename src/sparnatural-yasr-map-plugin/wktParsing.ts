import { Geometry, Point } from "geojson";
var Wkt = require('wicket')
/*
    Callback function for the MapPlugin. 
    Uses wicket to parse WktLiterals to GeoJson and leaflet objects
*/

export const wktToGeoJson = (literal:string): Geometry =>{
    // split on whitespaces and filter out multiple subsequent whitespaces
    const stringParts = literal.split(' ').filter((subStr)=> subStr !== " ")
    // look for either Point or Polygon string
    let featureType = stringParts.find((string)=>{
        return string.includes('Polygon') || string.includes('POLYLINE')|| string.includes('POINT') || string.includes('Point') || string.includes('Polyline') || string.includes('POLYGON')
    })
    if(!featureType) throw Error(`The parsing function couldn't find substring "Polygon" or "Point" in wktLiteral: ${literal}`)


    const ind = stringParts.findIndex((prt)=>prt.includes(featureType as string))
    let wkt = stringParts.slice(ind,stringParts.length).join(' ')
    const wktObj = new Wkt.Wkt()
    wktObj.read(wkt);
    //wktObj.toObject();
    return wktObj.toJson() as Point
}