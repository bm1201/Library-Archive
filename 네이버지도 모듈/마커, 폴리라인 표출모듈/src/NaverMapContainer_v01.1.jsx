import React from "react";
import { useEffect, useRef } from "react";
import useAxiosPrivate from '@/hooks/useAxiosPrivate';
import nodeAdd from '../../../public/images/node_add.png';
import nodeEdit from '../../../public/images/node_edit.png';
import nodeNom from '../../../public/images/node_nom.png';
import nodeSel from '../../../public/images/node_sel.png';

/**
 * NaverMap을 만들어줌
 * @param props
 * - lat
 * - lon
 * - zoom
 * @returns {JSX.Element}
 * @constructor
 */

const navermaps = window.naver.maps

const NaverMapContainer = (props) => {
    const navermap = useRef(null);
    const axiosPrivate = useAxiosPrivate();

    //네이버지도
    const map = useRef(null);
    const drawingManager = useRef(null);

    //네이버지도
    useEffect(() => {
        map.current = new navermaps.Map(navermap.current, {//지도 추가, 좌표를 기점으로 주변 지도가 추가된다.
            center: new navermaps.LatLng(36.3504119, 127.3845475),
            zoom: 16,
            mapTypeId: navermaps.MapTypeId.TERRAIN
            // minZoom: 6,
            // maxZoom: 22,
            // scaleControl: false,
            // logoControl: true,
            // mapDataControl: true,
            // zoomControl: true,
            // mapTypeControl: true
            }
        )

        drawingManager.current = new navermaps.drawing.DrawingManager({map: map.current});
    }, []);

    //마커관련 변수
    const markerArray = useRef([]); //지도 위의 표출마커
    const selectMarker = useRef(null); //선택마커 관리
    const insertMarker = useRef(null); //추가마커 관리
    const editMarker = useRef(null);   //편집마커 관리

    // 마커 표출 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnMarker?.data.length > 0){
            // 지도 위의 마커 초기화
            if(markerArray.current.length != 0){
                for(let i=0, n=markerArray.current.length; i<n; i++){
                    markerArray.current[i].setMap(null);
                }
            }

            // 마커 관련 데이터 세팅
            const markerDatalist = props.mapConf.fnMarker.data;
            const markerKey = props.mapConf.fnMarker.key;
            const markerLat = props.mapConf.fnMarker.coord.lat;
            const markerLon = props.mapConf.fnMarker.coord.lon;

            let markerArr = [];
            
            for(let i=0, n=markerDatalist.length; i<n; i++){
                //마커표출
                const marker = new navermaps.Marker({
                    position: new navermaps.LatLng(markerDatalist[i][markerLat], markerDatalist[i][markerLon]),
                    size : (5,5),
                    zIndex : 200,
                    icon : nodeNom,
                    // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                });

                marker[markerKey] = markerDatalist[i][markerKey];
                marker.setMap(map.current);

                markerArr.push(marker);
            }

            markerArray.current = markerArr;
        }
    }, [props.mapConf.fnMarker?.data]);

    // 마커 이벤트 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnMarkerEvt?.type !== null){
            const markerEvtType = props.mapConf.fnMarkerEvt?.type;
            const markerEvtData = props.mapConf.fnMarkerEvt?.data;

            if(markerEvtType === "SELECT"){
                //선택마커 초기화
                if(selectMarker.current !== null){
                    selectMarker.current.setIcon(nodeNom);
                }
                selectMarker.current= null;

                //마커 키 컬럼명
                const markerKey = props.mapConf.fnMarker.key;
                
                map.current.setCenter(new navermaps.LatLng(markerEvtData[props.mapConf.fnMarker.coord.lat], markerEvtData[props.mapConf.fnMarker.coord.lon]));
                map.current.setZoom(14);//원하는 지도크기 지정

                for(let i=0, n=markerArray.current.length; i<n ;i++){
                    if(markerArray.current[i][markerKey] === markerEvtData[markerKey]){
                        selectMarker.current = markerArray.current[i];
                        markerArray.current[i].setIcon(nodeSel);
                        break;
                    }
                }
            }

            if(markerEvtType === "ADD"){
                navermaps.Event.addListener(map.current, 'click', function (e) {
                    if(insertMarker.current !== null){
                        //기존 추가마커 삭제
                        insertMarker.current.setMap(null);
                    }
                    
                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(e.coord.y, e.coord.x),
                        size : (5,5),
                        icon : nodeAdd,
                        // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                    });
                    marker.setMap(map.current);
                    insertMarker.current = marker;
                });
            }

            if(markerEvtType === "EDIT"){
                navermaps.Event.addListener(map.current, 'click', function (e) {
                    if(editMarker.current !== null){
                        //기존 편집마커 삭제
                        editMarker.current.setMap(null);
                    }

                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(e.coord.y, e.coord.x),
                        size : (5,5),
                        icon : nodeEdit,
                        // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                    });
                    marker.setMap(map.current);
                    editMarker.current = marker;
                });
            }

            if(markerEvtType === "CANCEL" || markerEvtType === "SEARCH"){
                //추가마커 있는 경우 초기화
                if(insertMarker.current !== null){
                    insertMarker.current.setMap(null);
                    insertMarker.current = null;
                    //이벤트 초기화
                    navermaps.Event.clearListeners(map.current, "click");
                }

                //선택마커 있는 경우 초기화
                if(selectMarker.current !== null){
                    for(let i=0, n=markerArray.current.length; i<n; i++){
                        markerArray.current[i].setIcon(nodeNom);
                    }
                    selectMarker.current = null;
                }

                //편집마커 초기화
                if(editMarker.current !== null){
                    editMarker.current.setMap(null);
                    editMarker.current = null;
                    //이벤트 초기화
                    navermaps.Event.clearListeners(map.current, "click");
                }
            }
        }
    }, [props.mapConf.fnMarkerEvt?.type, props.mapConf.fnMarkerEvt?.data]);


    const polyLineArray = useRef([]);    //지도 위의 표출 폴리라인
    const selectPolyLine = useRef(null); //선택 폴리라인 관리

    // 폴리라인 표출 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnPolyLine?.data.length > 0){
            // 지도 위의 마커 초기화
            if(polyLineArray.current.length != 0){
                for(let i=0, n=polyLineArray.current.length; i<n; i++){
                    polyLineArray.current[i].setMap(null);
                }
            }

            // 폴리라인 관련 데이터 세팅
            const polyLineDatalist = props.mapConf.fnPolyLine.data;
            const polyLineKey = props.mapConf.fnPolyLine.key;
            const polyLineCoord = props.mapConf.fnPolyLine.vtx

            let polyLineArr = [];
            
            for(let i=0, n=polyLineDatalist.length; i<n; i++){
                // 폴리라인 표출
                const polyline = new navermaps.Polyline({
                    path: polyLineDatalist[i][polyLineCoord],
                    strokeWeight: 5,             //선 두께
                    strokeColor: '#808080',
                    strokeOpacity: 0.9,          //선 불투명도
                    strokeLineCap: 'round',      // 선 마감 스타일
                    strokeLineJoin: 'round',     // 선들이 맞닿는 부분의 마감 스타일
                });

                polyline[polyLineKey] = polyLineDatalist[i][polyLineKey];
                polyline.setMap(map.current);

                polyLineArr.push(polyline);
            }

            polyLineArray.current = polyLineArr;
        }
    }, [props.mapConf.fnPolyLine?.data]);

    // 폴리라인 이벤트 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnPolyLineEvt?.type !== null){
            const polyLineEvtType = props.mapConf.fnPolyLineEvt?.type;
            const polyLineEvtData = props.mapConf.fnPolyLineEvt?.data;
            const polyLineKey = props.mapConf.fnPolyLine?.key;

            if(polyLineEvtType === "SELECT"){
                //선택폴리라인 있는 경우 초기화
                if(selectPolyLine.current !== null){
                    selectPolyLine.current.setMap(null);
                }
                selectPolyLine.current = null;

                map.current.setCenter(new navermaps.LatLng(polyLineEvtData[props.mapConf.fnPolyLine.vtx][0]));
                map.current.setZoom(props.mapConf.mapZoomSize);//원하는 지도크기 지정

                //폴리라인
                const polyline = new navermaps.Polyline({
                    path: polyLineEvtData[props.mapConf.fnPolyLine.vtx],
                    strokeWeight: 5,             //선 두께
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.9,          //선 불투명도
                    strokeLineCap: 'round',      // 선 마감 스타일
                    strokeLineJoin: 'round',     // 선들이 맞닿는 부분의 마감 스타일
                    zIndex : 100
                });

                polyline[polyLineKey] = polyLineEvtData[polyLineKey];
                polyline.setMap(map.current);// 지도에 추가

                selectPolyLine.current = polyline;
            }

            if(polyLineEvtType === "EDIT"){
                drawingManager.current.addDrawing(selectPolyLine.current, navermaps.drawing.DrawingMode.POLYLINE, selectPolyLine.current[polyLineKey]);
                
                navermaps.Event.addListener(map.current, 'mousemove', function (e) {
                    //수정된 폴리라인 관련하여 추가처리 필요시 로직 추가
                    // const key = Object.keys(drawingManager.current.getDrawings())[0];
                    // const drawingData = drawingManager.current.getDrawings()[key];
                });
            }

            if(polyLineEvtType === "CANCEL"){
                //선택폴리라인 있는 경우 초기화
                if(selectPolyLine.current !== null){
                    selectPolyLine.current.setMap(null);
                    selectPolyLine.current = null;
                    // 맵이벤트 삭제
                    navermaps.Event.clearListeners(map.current, "mousemove");
                }

                //편집기 안에 있는 객체 제거
                const keyArr = Object.keys(drawingManager.current.getDrawings());
                for(let i=0, n=keyArr.length; i<n; i++){
                    drawingManager.current.removeDrawing(keyArr[i]);
                }
            }
        }
    }, [props.mapConf.fnPolyLineEvt?.type, props.mapConf.fnPolyLineEvt?.data]);

    /******************** MinMax 관련 함수 ********************/

    // 지도 크기 안의 모든 폴리라인, 노드 표출함수
    const getPolyLineMarkerMinMax = () => {
        if(props.mapConf.fnMinMax.marker.flag && props.mapConf.fnMinMax.polyLine.flag){
            //마커초기화
            if(markerArray.current.length != 0){
                for(let i=0; i<markerArray.current.length; i++){
                    markerArray.current[i].setMap(null);
                }
            }

            //폴리라인초기화
            if(polyLineArray.current.length != 0){
                for(let i=0; i<polyLineArray.current.length; i++){
                    polyLineArray.current[i].setMap(null);
                }
            }

            //지도 크기 내의 폴리라인 전부 표출
            let min = map.current.getBounds()._min;
            let max= map.current.getBounds()._max;
            let param = {
                param : [
                    { field : "minX", value : min.y},
                    { field : "maxX", value : max.y},
                    { field : "minY", value : min.x},
                    { field : "maxY", value : max.x}
                ]
            };

            //노드 표출
            const markerMinmaxUrl = props.mapConf.fnMinMax.marker.url;
            const markerKey = props.mapConf.fnMinMax.marker.key;

            axiosPrivate.post(markerMinmaxUrl, param)
            .then((res) => {
                const datalist = res.data.items;
                let markerArr = [];
                
                for(let i=0, n=datalist.length; i<n; i++){
                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                        size : (5,5),
                        icon : nodeNom,
                        // draggable : true,
                    });
                    
                    marker[markerKey] = datalist[i][markerKey];
                    marker.setMap(map.current);
                    markerArr.push(marker);
                }
            });

            //폴리라인 표출
            const linkMinmaxUrl = props.mapConf.fnMinMax.polyLine.url;
            const linkKey = props.mapConf.fnMinMax.polyLine.key;

            axiosPrivate.post(linkMinmaxUrl, param)
            .then((res) => {
                const datalist = res.data.items;
                let polyLineArr = [];

                for(let i=0; i<datalist.length; i++){
                    //폴리라인
                    const polyline = new navermaps.Polyline({
                        path: datalist[i].linkVtx,
                        strokeWeight: 5,             //선 두께
                        strokeColor: '#808080',
                        strokeOpacity: 0.9,          //선 불투명도
                        strokeLineCap: 'round',      // 선 마감 스타일
                        strokeLineJoin: 'round',      // 선들이 맞닿는 부분의 마감 스타일
                    });
                    
                    polyline[linkKey] = datalist[i][linkKey];
                    polyLineArr.push(polyline);
                    polyLineArr[i].setMap(map.current);
                }

                polyLineArray.current = polyLineArr;
            });
        }else if(props.mapConf.fnMinMax.marker.flag){
            //마커초기화
            if(markerArray.current.length != 0){
                for(let i=0; i<markerArray.current.length; i++){
                    markerArray.current[i].setMap(null);
                }
            }

            //지도 크기 내의 폴리라인 전부 표출
            let min = map.current.getBounds()._min;
            let max= map.current.getBounds()._max;
            let param = {
                param : [
                    { field : "minX", value : min.y},
                    { field : "maxX", value : max.y},
                    { field : "minY", value : min.x},
                    { field : "maxY", value : max.x}
                ]
            };

            //노드 표출
            const markerMinmaxUrl = props.mapConf.fnMinMax.marker.url;
            const markerKey = props.mapConf.fnMinMax.marker.key;

            axiosPrivate.post(markerMinmaxUrl, param)
            .then((res) => {
                let datalist = res.data.items;
                let markerArr = [];
                
                for(let i=0, n=datalist.length; i<n; i++){
                    let marker = new navermaps.Marker({
                        position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                        size : (5,5),
                        icon : nodeNom,
                        // draggable : false,
                    });
                    
                    marker[markerKey] = datalist[i][markerKey];
                    marker.setMap(map.current);
                    markerArr.push(marker);
                }
                
                markerArray.current = markerArr;
            });
        }else if(props.mapConf.fnMinMax.polyLine.flag){
            //폴리라인초기화
            if(polyLineArray.current.length != 0){
                for(let i=0; i<polyLineArray.current.length; i++){
                    polyLineArray.current[i].setMap(null);
                }
            }

            //지도 크기 내의 폴리라인 전부 표출
            let min = map.current.getBounds()._min;
            let max= map.current.getBounds()._max;
            let param = {
                param : [
                    { field : "minX", value : min.y},
                    { field : "maxX", value : max.y},
                    { field : "minY", value : min.x},
                    { field : "maxY", value : max.x}
                ]
            };

            //폴리라인 표출
            const linkMinmaxUrl = props.mapConf.fnMinMax.polyLine.url;
            const linkKey = props.mapConf.fnMinMax.polyLine.key;

            axiosPrivate.post(linkMinmaxUrl, param)
            .then((res) => {
                const datalist = res.data.items;
                let polyLineArr = [];

                for(let i=0; i<datalist.length; i++){
                    //폴리라인
                    const polyline = new navermaps.Polyline({
                        path: datalist[i].linkVtx,
                        strokeWeight: 5,             //선 두께
                        strokeColor: '#808080',
                        strokeOpacity: 0.9,          //선 불투명도
                        strokeLineCap: 'round',      // 선 마감 스타일
                        strokeLineJoin: 'round',      // 선들이 맞닿는 부분의 마감 스타일
                    });
                    
                    polyline[linkKey] = datalist[i][linkKey];
                    polyLineArr.push(polyline);
                    polyLineArr[i].setMap(map.current);
                }

                polyLineArray.current = polyLineArr;
            });
        }
    }

    // 조회 시 지도크기 안의 폴리라인 및 노드 표출 및 드래그 이벤트 작동
    useEffect(() => {
        if(props.mapConf.fnMinMax !== undefined){
            if(props.mapConf.fnMinMax.flag){
                getPolyLineMarkerMinMax();
            }

            //지도 드레그 시 폴리라인 및 노드 재표출
            navermaps.Event.addListener(map.current, 'dragend', function(e){
                props.mapConf.mapCenter.lon = e.coord.x;
                props.mapConf.mapCenter.lat = e.coord.y;
                props.mapOptConf({...props.mapConf});
            });
        }
    }, [props.mapConf.fnMinMax?.flag])

    // 지도 센터 변경 시 지도크기 안의 폴리라인 및 노드 재표출
    useEffect(()=>{
        if(props.mapConf.fnMinMax !== undefined){
            if(props.mapConf.fnMinMax.flag){
                getPolyLineMarkerMinMax();
            }
        }
    },[props.mapConf.mapCenter?.lon, props.mapConf.mapCenter?.lat])

    // MinMax 마커 이벤트 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnMinMaxMarkerEvt?.type !== null){
            const markerEvtType = props.mapConf.fnMinMaxMarkerEvt?.type;
            const markerEvtData = props.mapConf.fnMinMaxMarkerEvt?.data;
            const markerKey = props.mapConf.fnMinMax?.marker.key;

            if(markerEvtType === "SELECT"){
                //선택마커 초기화
                for(let i=0, n=markerArray.current.length; i<n; i++){
                    markerArray.current[i].setIcon(nodeNom);
                }
                selectMarker.current = null;

                map.current.setCenter(new navermaps.LatLng(markerEvtData.lat, markerEvtData.lon));
                map.current.setZoom(props.mapConf.mapZoomSize);
                props.mapConf.mapCenter.lon = {...markerEvtData.lon};
                props.mapConf.mapCenter.lat = {...markerEvtData.lat};
                props.mapOptConf({...props.mapConf});

                const marker = new navermaps.Marker({
                    position: new navermaps.LatLng(new navermaps.LatLng(markerEvtData.lat, markerEvtData.lon)),
                    size : (5,5),
                    icon : nodeSel,
                    // draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
                });

                marker[markerKey] = markerEvtData[markerKey];
                marker["markerInfo"] = markerEvtData;

                selectMarker.current = marker;
            }

            if(markerEvtType === "ADD"){
                navermaps.Event.addListener(map.current, 'click', function (e) {
                    if(insertMarker.current !== null){
                        //기존 추가마커 삭제
                        insertMarker.current.setMap(null);
                    }
                    
                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(e.coord.y, e.coord.x),
                        size : (5,5),
                        icon : nodeAdd,
                        // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                    });
                    marker.setMap(map.current);
                    insertMarker.current = marker;

                    for(let i=0, n=props.formDtlConf.columns.length; i<n; i++){
                        if(props.formDtlConf.columns[i].id === "lon"){
                            props.formDtlConf.columns[i].value = e.coord.x
                            props.setFormDtlConf({...props.formDtlConf});
                        }else if(props.formDtlConf.columns[i].id === "lat"){
                            props.formDtlConf.columns[i].value = e.coord.y
                            props.setFormDtlConf({...props.formDtlConf});
                        }
                    }
                });
            }

            if(markerEvtType === "EDIT"){
                navermaps.Event.addListener(map.current, 'click', function (e) {
                    if(editMarker.current !== null){
                        //기존 편집마커 삭제
                        editMarker.current.setMap(null);
                    }

                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(e.coord.y, e.coord.x),
                        size : (5,5),
                        icon : nodeEdit,
                        // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                    });
                    marker.setMap(map.current);
                    editMarker.current = marker;

                    for(let i=0, n=props.formDtlConf.columns.length; i<n; i++){
                        if(props.formDtlConf.columns[i].id === "lon"){
                            props.formDtlConf.columns[i].value = e.coord.x
                            props.setFormDtlConf({...props.formDtlConf});
                        }else if(props.formDtlConf.columns[i].id === "lat"){
                            props.formDtlConf.columns[i].value = e.coord.y
                            props.setFormDtlConf({...props.formDtlConf});
                        }
                    }
                });
            }

            if(markerEvtType === "CANCEL" || markerEvtType === "SEARCH"){
                //추가마커 있는 경우 초기화
                if(insertMarker.current !== null){
                    insertMarker.current.setMap(null);
                    insertMarker.current = null;
                    //이벤트 초기화
                    navermaps.Event.clearListeners(map.current, "click");
                }

                //선택마커 있는 경우 초기화
                if(selectMarker.current !== null){
                    for(let i=0, n=markerArray.current.length; i<n; i++){
                        markerArray.current[i].setIcon(nodeNom);
                    }
                    selectMarker.current = null;
                }

                //편집마커 초기화
                if(editMarker.current !== null){
                    editMarker.current.setMap(null);
                    editMarker.current = null;
                    //이벤트 초기화
                    navermaps.Event.clearListeners(map.current, "click");
                }

                //지도 재조회
                if(props.mapConf.mapCenter !== undefined){
                    props.mapConf.mapCenter.lon = map.current.getCenter().x;
                    props.mapConf.mapCenter.lat = map.current.getCenter().y;
                    props.mapOptConf({...props.mapConf}); 
                }
            }
        }
    }, [props.mapConf.fnMinMaxMarkerEvt?.type, props.mapConf.fnMinMaxMarkerEvt?.data]);

    // MinMax 폴리라인 이벤트 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnMinMaxPolyLineEvt?.type !== null){
            //폴리라인 관련 변수
            const polyLineEvtType = props.mapConf.fnMinMaxPolyLineEvt?.type; //이벤트 타입
            const polyLineEvtData = props.mapConf.fnMinMaxPolyLineEvt?.data; //이벤트 데이터
            const polyLineEvtVtxData = props.mapConf.fnMinMaxPolyLineEvt?.data.linkVtx; //이벤트 폴리라인 VTX 데이터
            const polyLineKey = props.mapConf.fnMinMax?.polyLine.key; //폴리라인 key
            
            if(polyLineEvtType === "SELECT"){
                //선택폴리라인 있는 경우 초기화
                if(selectPolyLine.current !== null){
                    selectPolyLine.current.setMap(null);
                }
                selectPolyLine.current = null;

                map.current.setCenter(new navermaps.LatLng(polyLineEvtVtxData[0]));
                map.current.setZoom(props.mapConf.mapZoomSize);
                props.mapConf.mapCenter.lon = {...polyLineEvtVtxData[0][0]};
                props.mapConf.mapCenter.lat = {...polyLineEvtVtxData[0][1]};
                props.mapOptConf({...props.mapConf});

                //폴리라인
                const polyline = new navermaps.Polyline({
                    path: polyLineEvtVtxData,
                    strokeWeight: 5,             //선 두께
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.9,          //선 불투명도
                    strokeLineCap: 'round',      // 선 마감 스타일
                    strokeLineJoin: 'round',     // 선들이 맞닿는 부분의 마감 스타일
                    zIndex : 100
                });

                polyline[polyLineKey] = polyLineEvtData[polyLineKey];
                polyline.setMap(map.current);// 지도에 추가

                selectPolyLine.current = polyline;
            }

            if(polyLineEvtType === "EDIT"){
                drawingManager.current.addDrawing(selectPolyLine.current, navermaps.drawing.DrawingMode.POLYLINE, selectPolyLine.current[polyLineKey]);
                
                navermaps.Event.addListener(map.current, 'mousemove', function (e) {
                    //수정된 폴리라인 관련하여 추가처리 필요시 로직 추가
                    // const key = Object.keys(drawingManager.current.getDrawings())[0];
                    // const drawingData = drawingManager.current.getDrawings()[key];
                });
            }

            if(polyLineEvtType === "CANCEL"){
                //클릭 폴리라인 초기화
                if(selectPolyLine.current !== null){
                    selectPolyLine.current.setMap(null);
                    selectPolyLine.current = null;
                }

                //편집기 안에 있는 객체 제거
                const keyArr = Object.keys(drawingManager.current.getDrawings());
                for(let i=0, n=keyArr.length; i<n; i++){
                    drawingManager.current.removeDrawing(keyArr[i]);
                }

                //지도 재조회
                if(props.mapConf.mapCenter !== undefined){
                    props.mapConf.mapCenter.lon = map.current.getCenter().x;
                    props.mapConf.mapCenter.lat = map.current.getCenter().y;
                    props.mapOptConf({...props.mapConf}); 
                }
            }
        }
    }, [props.mapConf.fnMinMaxPolyLineEvt?.type, props.mapConf.fnMinMaxPolyLineEvt?.data]);

    /******************** 공통기능 ********************/
    // 지도 줌 크기 재조절 함수
    useEffect(() => {
        if(props.mapConf.mapZoomSize !== undefined){
            map.current.setZoom(props.mapConf.mapZoomSize);
        }
    }, [props.mapConf.mapZoomSize]);

    return (
        <div ref={navermap} style={{width: "100%", height: "100%"}}>
        </div>
    );

};

export default NaverMapContainer;
