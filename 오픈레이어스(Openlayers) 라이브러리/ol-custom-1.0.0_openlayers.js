/*
 @author ByungMin
 @since 2023-09-24 <br/>
 @note
 2023-10-19 드래그 관련 이벤트(setDragEvt(obj), removeDragEvt(obj))로 변경
            지도 중심 이동 함수 that, this 제거
 2023-10-20 오버레이 함수 통합
*/
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source.js';
import View from 'ol/View.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Overlay from 'ol/Overlay.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import WKT from 'ol/format/WKT.js';
import Collection from 'ol/Collection.js';
import {unByKey} from 'ol/Observable';
import * as olRender from 'ol/render';
import * as olEasing from 'ol/easing';
import { Fill, Stroke, Style, Icon, Circle } from 'ol/style.js';
import { Draw, Modify, Snap } from 'ol/interaction.js';
import { transform } from 'ol/proj';

const $Class = function (oClassMember) {
    function ClassOrigin() {
        if (this.$init) {
            this.$init.apply(this, arguments);
        }
    }
    ClassOrigin.prototype = oClassMember;
    ClassOrigin.prototype.constructor = ClassOrigin;
    return ClassOrigin;
};

const OL = new ($Class({
    $init: function () {
        console.log('init');
    },
    /*통신*/
    ajax: function (url, callback) {
        // Create an XMLHttpRequest object
        const xhttp = new XMLHttpRequest();

        // Define a callback function
        xhttp.onload = function () {
            callback(JSON.parse(this.responseText));
        };

        // Send a request
        xhttp.open('GET', url);
        xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhttp.send();
    },
    //"EPSG:4326" : WGS84, 경위도 좌표계, [126.498197, 33.489004]
    //"EPSG:3857" : OSM, 구글지도, [14132768.655320833, 4494203.933595929]
    //"EPSG:5186" : WMS, [1563365.05908124548, 99597.567890962]
    transformOSM: function(xy){
        return transform(xy, "EPSG:4326", "EPSG:3857");
    },
    transformWGS84: function(xy){
        return transform(xy, "EPSG:3857", "EPSG:4326");
    },
    /*지도 생성*/
    roadMap: function (obj) {
        // obj = target
        let map = new Map({
            layers: [
                new TileLayer({
                    source: new OSM()
                })
            ],
            target: obj.target,
            view: new View({
                projection: 'EPSG:4326',
                center: [126.9568209, 37.3942527], //안산시청
                zoom: 16
            }),
            // controls: [new ol.control.Zoom(), new ol.control.ZoomSlider(), new ol.control.ScaleLine()]
        });

        this[obj.target] = new ($Class({
            $init: function (map) {
                this.map = map;
                this.tooltipObj = {};
                this.selectedObj = null;
                this.onmousemoveObj = null;
                this.setClickEvt();
                this.setHoverEvt();
                this.setWheelEvt();
            },
            /******************** 지도 중심 이동 함수 ********************/
            setCenter: function (mapCenter) {
                // mapCenter : [경도, 위도]
                map.getView().setCenter(mapCenter);
                map.getView().setZoom(16);
            },
            /*컨트롤 올리기*/
            addControl: function (control) {
                this.map.addControl(control);
            },
            
            /******************** layer 관련 함수 ********************/
            /*레이어 조회*/
            getLayer: function (obj) {
                // obj = lid
                if (this.map === null) return null;

                let layers = this.map.getLayers().getArray();
                for (let i = 0; i < layers.length; i++) {
                    if (obj.lid === undefined) return null;

                    if (layers[i].lid === obj.lid) {
                        return layers[i];
                    }
                }

                return null;
            },      
            /*레이어 추가*/
            addLayer: function (obj) {
                // obj = type / lid / name / urls / onSelect / minZoom / unSelect / onmouseenter / onmouseleave / styles
                if (this.map === null) return null;
                let layer = this.getLayer(obj);
                if (layer !== null) return layer;

                switch (obj.type) {
                    case 'vector':
                        let vsrc = new VectorSource({
                            features: []
                        });
                        layer = new VectorLayer({
                            source: vsrc
                        });

                        layer.lid = obj.lid;
                        layer.istyle = [];
                        layer.minZoom = obj.minZoom;
                        layer.click = obj.click;
                        layer.onSelect = obj.onSelect;
                        layer.unSelect = obj.unSelect;
                        layer.onmouseenter = obj.onmouseenter;
                        layer.onmouseleave = obj.onmouseleave;

                        this.map.addLayer(layer);

                        if (obj.styles) {
                            if (!Array.isArray(obj.styles)) obj.styles = [obj.styles];

                            for (let i = 0; i < obj.styles.length; i++) {
                                let istyle = new Style({
                                    fill: new Fill(obj.styles[i].fill),
                                    stroke: new Stroke(obj.styles[i].stroke)
                                });
                                layer.istyle.push(istyle);
                                if (i == 0) layer.setStyle(istyle);
                            }

                            break;
                        }
                        if (obj.urls) {
                            if (!Array.isArray(obj.urls)) obj.urls = [obj.urls];

                            for (let i = 0; i < obj.urls.length; i++) {
                                let istyle = new Style({
                                    image: new Icon({
                                        anchor: [0.5, 0.5],
                                        anchorXUnits: 'fraction',
                                        anchorYUnits: 'fraction',
                                        src: obj.urls[i],
                                        scale: 1,
                                        opacity: 1
                                    })
                                });
                                layer.istyle.push(istyle);
                                if (i == 0) layer.setStyle(istyle);
                            }
                            break;
                        }
                        if (obj.fcltEvt) {
                            if (!Array.isArray(obj.fcltEvt)) {
                                obj.fcltEvt = [obj.fcltEvt];
                            }
                            
                            for (let i = 0; i < obj.fcltEvt.length; i++) {
                                if(obj.fcltEvt[i] === "circle"){
                                    let istyle = new Style({
                                        image: new Circle({
                                            radius: 1,
                                            stroke: new Stroke({
                                              color: 'rgba(255, 0, 0, 0.5)',
                                              width: 45,
                                            }),
                                          })
                                    });
                                    layer.istyle.push(istyle);
                                    if (i == 0) layer.setStyle(istyle);
                                }
                            }
                            break;
                        }
                        if (obj.colors) {
                            if (!Array.isArray(obj.colors)) obj.colors = [obj.colors];

                            for (let i = 0; i < obj.colors.length; i++) {
                                let istyle = new Style({
                                    fill: new Fill({
                                        color: obj.colors[i]
                                    })
                                });
                                layer.istyle.push(istyle);
                                if (i == 0) layer.setStyle(istyle);
                            }
                            break;
                        }
                        if (layer.istyle.length > 0) {
                            layer.setStyle(layer.istyle[0]);
                        }
                        break;
                    default:
                        console.log(obj.type);
                }
                return layer;
            },
            // layer 곂치는 순서 변경
            changeZIndex: function (lyrs) {
                // {lyrs : [layer1, layer2, layer3]}
                // ex) 만약 2, 3, 1 순으로 정렬하고 싶다면 [layer2, layer3, layer1] 형태로 파라미터 보내야함
                for (let i = 0; i < lyrs.length; i++) {
                    lyrs[i].setZIndex(i + 1);
                }
            },

            /******************** overlay 관련 함수 ********************/
            //오버레이 추가
            addPopup : function (obj) {//obj = {pid, element}
                const popup = new Overlay({
                    element: obj.element
                });
                popup['pid'] = obj.pid
                popup.setPosition(obj.coord);

                map.addOverlay(popup);
                
                return popup;
            },
            getPopup(obj){//obj = {pid(popupId)}
                const popupId = obj.pid
                const overlays = map.getOverlays().getArray();

                for(let i=0; i<overlays.length; i++){
                    if(overlays[i].pid == popupId){
                        return overlays[i];
                    }else if(i === overlays.length-1){
                        return null;
                    }
                }
            },
            //map에 overlay 추가
            addOverlay: function (obj) {
                //obj = {
                //    oid : overlayId, 
                //    element : createElement
                //    coord : 생성위치 ex) [위도, 경도] 
                //    // offset: [0, 0],
                //    // positioning: 'top-left'
                // }

                const oly = new Overlay({
                    element: obj.element
                });
                oly['oid'] = obj.oid
                oly.setPosition(obj.coord);

                map.addOverlay(oly);
                
                return oly;
            },
            //map에 특정 overlay 조회
            getOverlay: function (obj) {
                //obj = {
                //    oid : overlayId,
                // }
                const overlays = map.getOverlays().getArray();
                
                if(overlays.length === 0){
                    return null;
                }else{
                    for(let i=0; i<overlays.length; i++){
                        if(overlays[i].oid === obj.oid){
                            return overlays[i]
                        }
                    }
                    return null;
                }
            },
            //map에 특정 overlay 제거
            removeOverlay: function (overlay) {
                this.map.removeOverlay(overlay);
            },
            //map에 모든 overlay 제거
            removeOverlayAll: function () {
                const overlays = map.getOverlays().getArray();
                
                if(overlays.length > 0){
                    for(let i=overlays.length-1; i>=0; i--){
                        this.map.removeOverlay(overlays[i]);
                    }
                }
            },

            /******************** Feature 관련 함수 ********************/
            //layer에 마커 추가
            addFeature: function (obj) {
                // obj = { 
                //     lid : layerId
                //     fid : featureId
                //     xy  : [경도, 위도]
                //     state : 표출 이미지(layer 속성 중 URL의 index 번호)
                // }

                let layer = this.getLayer(obj);
                
                if (layer === null){//layer가 없는 경우
                    return null;
                }
                    
                let src = layer.getSource();

                let ftr = this.getFeature(obj);

                if (ftr === null) {
                    if (layer.istyle.length < obj.state + 1) {
                        obj.state = 0;
                    }

                    let istyle = layer.istyle[obj.state];

                    ftr = new Feature({ geometry: new Point(obj.xy) });

                    ftr.fid = obj.fid;
                    ftr.layer = layer;
                    ftr.setStyle(istyle);
                    src.addFeature(ftr);
                }

                return ftr;
            },
            //layer에 폴리라인 추가
            addPolyline: function (obj) {
                // obj = { 
                //     lid  : layerId
                //     fid  : featureId
                //     data : [[경도, 위도], [경도, 위도], ....]
                // }
                const coordlist = obj.data;
                const lyr = this.getLayer({lid : obj.lid});
                
                let coords = "";
                
                for(let i = 0; i < coordlist.length; i++){
                    if(coords !== ""){
                        coords += ",";
                    }
                    
                    coords += coordlist[i][0] + " " + coordlist[i][1];
                }
                
                const lineStr = new WKT().readFeatures("GEOMETRYCOLLECTION(LINESTRING(" + coords + "))", {});
                lineStr[0].fid = obj.fid;
                
                lyr.getSource().addFeatures(lineStr);
            },
            //layer에 특정 feature 조회
            getFeature: function (obj) {
                // obj = { 
                //     lid : layerId
                //     fid : featureId
                // }
                let layer = this.getLayer(obj);
                if (layer === null){
                    return null;
                }

                let src = layer.getSource();
                let ftrs = src.getFeatures();
                
                for (let i = 0; i < ftrs.length; i++) {
                    if (ftrs[i].fid === obj.fid){
                        return ftrs[i];
                    }
                        
                }
                return null;
            },
            //layer의 모든 feature 조회
            getFeatureAll: function (obj) {
                // obj = { 
                //     lid : layerId
                // }
                let layer = this.getLayer(obj);
                if (layer === null) return null;

                let src = layer.getSource();
                let ftrs = src.getFeatures();

                if (ftrs.length > 0) {
                    return ftrs;
                } else {
                    return null;
                }
            },
            //layer의 특정 feature 삭제
            removeFeature: function (obj) {
                // obj = { 
                //     lid : layerId
                //     fid : featureId
                // }
                let layer = this.getLayer(obj);

                if (layer === null) return null;

                let src = layer.getSource();
                let ftrs = src.getFeatures();

                if (ftrs.length > 0) {
                    for (let i = 0; i < ftrs.length; i++) {
                        if (ftrs[i].fid === obj.fid) {
                            src.removeFeature(ftrs[i]);
                        }
                    }
                }
            },
            //layer의 모든 feature 삭제
            removeFeatureAll: function (obj) {
                // obj = { 
                //     lid : layerId
                // }
                let layer = this.getLayer(obj);

                if (layer === null) return null;

                let src = layer.getSource();
                let ftrs = src.getFeatures();

                if (ftrs.length > 0) {
                    for (let i = 0; i < ftrs.length; i++) {
                        src.removeFeature(ftrs[i]);
                    }
                }
            },
            //layer에 폴리라인 추가 => 추후삭제
            addPolyline2: function (obj) {// obj = {lid, fid, data}
                // obj = { 
                //     lid  : layerId
                //     fid  : featureId
                //     data : [[경도, 위도], [경도, 위도], ....]
                // }
                const coordlist = obj.data.position;
                console.log(obj.data.position);
                const lyr = this.getLayer({lid : obj.lid});

                let coords = "";

                for(let i = 0; i < coordlist.length; i++){
                    if(coords !== ""){
                        coords += ",";
                    }
                    
                    coords += coordlist[i].lgtd + " " + coordlist[i].lttd;
                }

                const lineStr = new WKT().readFeatures("GEOMETRYCOLLECTION(LINESTRING(" + coords + "))", {});
                lineStr[0].fid = obj.fid;

                lyr.getSource().addFeatures(lineStr);
            },

            /******************** 이벤트 관련 함수 ********************/
            // 셀렉트 & 언셀렉트 이벤트 추가
            setClickEvt: function () {
                var that = this;
                that.map.on('click', function (e) {
                    let layers = e.target.getLayers().getArray();

                    for (let i = 0; i < layers.length; i++) {
                        if (layers[i].click !== undefined) {
                            console.log('실행');
                            return layers[i].click.apply(null, [e]);
                        }
                    }

                    var result = that.map.forEachFeatureAtPixel(e.pixel, function (ftr) {
                        if (ftr === undefined || ftr === null) {
                            return null;
                        }
                        if (ftr.layer.onSelect === undefined || ftr.layer.onSelect === null) {
                            return null;
                        }
                        ftr.layer.onSelect(ftr, e);
                        that.selectedObj = ftr;

                        // const snap = new Snap({source: ftr.layer.getSource()});

                        return ftr;
                    });

                    if (!result && that.selectedObj) {
                        if (that.selectedObj.layer.unSelect === undefined || that.selectedObj.layer.unSelect === null) {
                            return;
                        }
                        that.selectedObj.layer.unSelect(that.selectedObj, e);
                        that.selectedObj = null;
                    }
                });
            },
            // 마우스엔터 & 마우스리브 이벤트 추가
            setHoverEvt: function () {
                var that = this;
                that.map.on('pointermove', function (e) {
                    var result = that.map.forEachFeatureAtPixel(e.pixel, function (ftr) {
                        //드래그 이벤트시 팝업도 함께 이동
                        const popup = ftr.popup;
                        
                        if(popup){
                            popup.setPosition(ftr.getGeometry().flatCoordinates);
                        }
                        
                        if (e.dragging) {
                            return;
                        }

                        if (ftr === undefined || ftr === null) {
                            return;
                        }
                        if (ftr.layer === undefined) {
                            return;
                        }
                        if (ftr.layer.onmouseenter === undefined || ftr.layer.onmouseenter === null) {
                            return;
                        }
                        ftr.layer.onmouseenter(ftr, e);

                        that.onmousemoveObj = ftr;
                        return ftr;
                    });
                    if (!result && that.onmousemoveObj) {
                        if (that.onmousemoveObj.layer.onmouseleave === undefined || that.onmousemoveObj.layer.onmouseleave === null) {
                            return;
                        }
                        that.onmousemoveObj.layer.onmouseleave(that.onmousemoveObj, e);
                        that.onmousemoveObj = null;
                    }
                });
            },
            setWheelEvt: function () {
                let that = this;
                that.map.getView().on('change:resolution', function (e) {
                    if (that.map.ov != Math.floor(e.target.getZoom())) {
                        let layers = that.map.getLayers().getArray();
                        for (let l = 0; l < layers.length; l++) {
                            if (layers[l].minZoom >= Math.floor(e.target.getZoom())) {
                                layers[l].setVisible(false);
                            } else {
                                layers[l].setVisible(true);
                            }
                        }
                    }
                    that.map.ov = Math.floor(e.target.getZoom());
                });
            },
            unSelect: function () {},
            //drag 이벤트 추가
            setDragEvt : function (obj) {
                //obj = {
                //     evtId  : evtId, 
                //     ftrArr : [ftr, ftr, ...]
                //}

                // drag 이벤트 생성
                let modify = new Modify({ features: new Collection(obj.ftrArr) });
                modify.dragEvtId = obj.evtId;

                map.addInteraction(modify);//지도에 이벤트 추가
            },
            //drag 이벤트 제거
            removeDragEvt : function(){
                const modifyArr = map.getInteractions().getArray();
                // 이벤트 제거
                for(let i=0, n=modifyArr.length; i<n; i++){
                    if(modifyArr[i].dragEvtId !== undefined){
                        map.removeInteraction(modifyArr[i]);
                    }
                }
            },
            // 원 애니메이션
            playFcltEvt(feature, cretCycl){
                const duration = cretCycl;

                const start = Date.now();
                const flashGeom = feature.getGeometry().clone();
                
                const listenerKey = this.getLayer({lid : "fcltEvt"}).on('postrender', animate);

                function animate(event) {
                    const frameState = event.frameState;

                    const elapsed = frameState.time - start;

                    if (elapsed >= duration) {
                        unByKey(listenerKey);
                        return;
                    }

                    const vectorContext = olRender.getVectorContext(event);
                    const elapsedRatio = elapsed / duration;

                    // radius will be 5 at start and 30 at end.
                    const radius = olEasing.easeOut(elapsedRatio) * 50;
                    const opacity = olEasing.easeOut(1 - elapsedRatio);
                
                    const style = new Style({
                        image: new Circle({
                            radius: radius,
                            stroke: new Stroke({
                              color: 'rgba(255, 0, 0, ' + opacity + ')',
                              width: 5,
                            }),
                          })
                    });
                
                    vectorContext.setStyle(style);
                    vectorContext.drawGeometry(flashGeom);

                    // tell OpenLayers to continue postrender animation
                    map.render();
                }

                if(this.getFeature({lid : "fcltEvt", fid : feature.fid})){
                    this.removeFeature({lid : "fcltEvt", fid : feature.fid})
                }

                this.getLayer({lid : "fcltEvt"}).getSource().addFeature(feature);
            },
            /******************** 미사용함수 ********************/
            // /*geojson 읽기*/
            // readGeoJson: function (result, lyr) {
            //     var arr = new ol.format.GeoJSON().readFeatures(result);
            //     return arr;
            // },
            // addTooltip: function (id) {
            //     var tooltipElement = document.getElementById(id);
            //     tooltipElement.style.display = '';

            //     let tooltip = new ol.Overlay({
            //         element: document.getElementById(id),
            //         offset: [0, 0],
            //         positioning: 'top-left'
            //     });
            //     this.tooltipObj[id] = tooltip;
            //     this.addOverlay(tooltip);
            //     tooltip.setVisible(true);

            //     return tooltip;
            // },
            // getTooltip: function (id) {
            //     return this.tooltipObj[id];
            // },
            // removeTooltip: function (id) {
            //     var tooltip = this.tooltipObj[id];
            //     var tooltipElement = document.getElementById(id);
            //     tooltipElement.style.display = 'none';

            //     document.body.appendChild(tooltipElement);
            //     this.removeOverlay(tooltip);
            // },
        }))(map);
        return this[obj.target].map;
    }
}))();
export default OL;
