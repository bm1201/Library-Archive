import React from "react";
import { useEffect, useRef } from "react";
import nodeAdd from '../../public/images/node_add.png';
import nodeEdit from '../../public/images/node_edit.png';
import nodeNom from '../../public/images/node_nom.png'
import nodeSel from '../../public/images/node_sel.png';

/**
 * 기본화면 네이버지도
 * @param {*} props 
 * 2023.12.07 소스 Refactorying 및 기능개선
 * 2023.12.18 selMarkerInfo 배열로 변경하여 관련 로직 복수처리 가능하도록 소스수정
 * 2023.01.09 이벤트 func이 있는 경우 해당 func 실행(마커의 insert, update참고)
 *            우리나라 유효좌표 밖에 있는 좌표의 경우 표출하지 않는 기능 추가(우리나라 유효좌표 (124.5 < lon < 132.0) / (33 < lat < 38.9), markerAddOpt참고)
 *            폴리라인 edit기능 오픈, drawingManager 상자 숨김
 */

const navermaps = window.naver.maps

const CompNaverMap = (props) => {
    const { setMapMinMax, mapCenterLonLat, zoomSize, markerAddOpt, markerEvtOpt, polylineAddOpt, polylineEvtOpt, ...others} = props;

    //네이버지도
    const mapId = props?.mapId || 'navermap'
    const map = useRef(null);
    const drawingManager = useRef(null);

    //마커 관련 변수 및 함수
    const markersInfo = useRef({});      //지도 위의 마커 정보
    const selMarkerInfo = useRef([]);    //선택마커 관리
    const insMarkerInfo = useRef(null);  //추가마커 관리
    const updMarkerInfo = useRef(null);  //수정마커 관리

    //폴리라인 관련 변수 및 함수
    const polylinesInfo = useRef({});   //지도 위의 폴리라인 정보
    const selPolylineInfo = useRef({}); //선택 폴리라인 관리

    /******************** 공통기능 ********************/
    //네이버지도 생성(지도 옵션은 https://navermaps.github.io/maps.js.ncp/docs/tutorial-digest.example.html 참고)
    useEffect(() => {
        map.current = new navermaps.Map(mapId, {
            zoom: 14,
            center: new navermaps.LatLng(37.39256374, 126.95518245),//해당 좌표를 기점으로 지도가 추가된다.
            mapTypeId: navermaps.MapTypeId.TERRAIN,
            minZoom: 6,
            maxZoom: 20,
            // scaleControl: false,
            // logoControl: true,
            // mapDataControl: true,
            // zoomControl: true,
            // mapTypeControl: true
            }
        )

        //특정 줌 size 이하일때는 마커와 폴리라인 표출하지 않음
        navermaps.Event.addListener(map.current, 'zoom_changed', function (e) {
            const keyList = Object.keys(markersInfo.current);
            const keyList2 = Object.keys(polylinesInfo.current);

            if(e < 12){
                for(let i=0, n=keyList.length; i<n; i++){
                    markersInfo.current[keyList[i]].setVisible(false);
                }

                for(let i=0, n=keyList2.length; i<n; i++){
                    polylinesInfo.current[keyList2[i]].setVisible(false);
                }
            }else{
                for(let i=0, n=keyList.length; i<n; i++){
                    markersInfo.current[keyList[i]].setVisible(true);
                }

                for(let i=0, n=keyList2.length; i<n; i++){
                    polylinesInfo.current[keyList2[i]].setVisible(true);
                }
            }
        });
        
        // 지도 MixMax 크기 리턴
        if(setMapMinMax !== undefined){
            const min = map.current.getBounds()._min;
            const max= map.current.getBounds()._max;
            const mapMinMax = [
                { field : "minX", value : min.x},
                { field : "maxX", value : max.x},
                { field : "minY", value : min.y},
                { field : "maxY", value : max.y}
            ];
            setMapMinMax(mapMinMax);
        }

        /**
         * Edit 이벤트를 사용하기 위해서 필요
         * */
        navermaps.Event.once(map.current, 'init', function() {
            drawingManager.current = new navermaps.drawing.DrawingManager({map: map.current});
            
            //그리기 상자 숨김
            drawingManager.current.setOptions('drawingControlOptions', {
                position: naver.maps.Position.LEFT_TOP
            });
            drawingManager.current.setOptions('drawingControl', null);
        });
    }, []);

    //지도 중심 변경
    useEffect(() => {
        if(mapCenterLonLat !== undefined && mapCenterLonLat.length > 0){
            map.current.setCenter(new navermaps.LatLng(mapCenterLonLat[1], mapCenterLonLat[0]));
        }
    }, [mapCenterLonLat])

    //지도 줌 변경
    useEffect(() => {
        if(zoomSize !== undefined){//zoomSize가 있는경우
            map.current.setZoom(zoomSize);
        }
    }, [zoomSize])
    /******************** 공통기능 End ********************/

    /******************** 마커 관련 기능 ********************/
    //지도에 기본마커 추가
    useEffect(() => {
        if(markerAddOpt !== undefined && Object.keys(markerAddOpt).length > 0){//markerOpt이 있는 경우
            //지도 위의 기본마커 표출
            const key = markerAddOpt.key;
            const lat = markerAddOpt.coord.lat;
            const lon = markerAddOpt.coord.lon;
            const data = markerAddOpt.data;

            for(let i=0, n=data.length; i<n; i++){
                if(124.5 < data[i][lon] && data[i][lon] < 132.0 && 33 < data[i][lat] && data[i][lat] < 38.9){
                    //마커생성
                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(data[i][lat], data[i][lon]), //마커 생성위치치
                        size : (5,5),                                               // 마커 size
                        zIndex : 200,                                               // zIndex
                        icon : nodeNom,                                             // 마커 Icon  
                        draggable : true,                                           // 마커 drag 여부
                    });
    
                    marker["markerId"] = data[i][key];//marker에 markerId 추가
    
                    //마커정보 HashMap 형태로 저장
                    markersInfo.current[data[i][key]] = marker;
                    
                    //지도에 추가
                    marker.setMap(map.current);
                }
            }
        }
    }, [markerAddOpt])
    
    //마커 이벤트 처리
    useEffect(() => {
        if(markerEvtOpt !== undefined && Object.keys(markerEvtOpt).length > 0){
            switch(markerEvtOpt.type){
                case "select" :
                    //기존 선택마커가 있는 경우 기본마커로 Icon 변경
                    for(let i=0, n=selMarkerInfo.current.length; i<n; i++){
                        selMarkerInfo.current[i].setIcon(nodeNom);
                    }
                    selMarkerInfo.current = [];

                    for(let i=0, n=markerEvtOpt.key.length; i<n; i++){
                        //선택 마커로 Icon 변경
                        markersInfo.current[markerEvtOpt.key[i]].setIcon(nodeSel);
                        
                        //선택 마커 Ref로 저장
                        selMarkerInfo.current.push(markersInfo.current[markerEvtOpt.key[i]]);
                    }

                    //해당 위치로 지도 중심 이동
                    if(selMarkerInfo.current.length === 1){
                        map.current.setCenter(selMarkerInfo.current[0].getPosition());
                    }else{
                        const lon = (selMarkerInfo.current[0].getPosition().x + selMarkerInfo.current[1].getPosition().x) / 2
                        const lat = (selMarkerInfo.current[0].getPosition().y + selMarkerInfo.current[1].getPosition().y) / 2
                        map.current.setCenter(new navermaps.LatLng(lat, lon));
                    }

                    break;
                case "unSelet" :
                    //기존 선택마커 모두 기본마커로 변경
                    for(let i=0, n=selMarkerInfo.current.length; i<n; i++){
                        selMarkerInfo.current[i].setIcon(nodeNom);
                    }
                    selMarkerInfo.current = [];
                    break;
                case "insert" :
                    //지도에 클릭 시 해당 위치에 추가마커 생성
                    navermaps.Event.addListener(map.current, 'click', function (e) {
                        if(insMarkerInfo.current !== null){
                            //기존 추가마커 삭제
                            insMarkerInfo.current.setMap(null);
                        }
                        
                        const marker = new navermaps.Marker({
                            position: new navermaps.LatLng(e.coord.y, e.coord.x),
                            size : (5,5),
                            icon : nodeAdd,
                            draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
                        });
                        marker.setMap(map.current);
                        insMarkerInfo.current = marker;
                        
                        //이벤트에 함수옵션이 있는경우 함수 실행
                        if(markerEvtOpt?.func){
                            markerEvtOpt.func(e);
                        }
                    });
                    break;
                case "update" :
                    //지도에 클릭 시 해당 위치에 수정마커 생성
                    navermaps.Event.addListener(map.current, 'click', function (e) {
                        if(updMarkerInfo.current !== null){
                            //기존 수정마커 삭제
                            updMarkerInfo.current.setMap(null);
                        }

                        const marker = new navermaps.Marker({
                            position: new navermaps.LatLng(e.coord.y, e.coord.x),
                            size : (5,5),
                            icon : nodeEdit,
                            draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
                        });
                        marker.setMap(map.current);
                        updMarkerInfo.current = marker;

                        //이벤트에 함수옵션이 있는경우 함수 실행
                        if(markerEvtOpt?.func){
                            markerEvtOpt.func(e);
                        }
                    });
                    break;
                case "delete" :
                    //마커 삭제 이벤트
                    for(let i=0, n=markerEvtOpt.key.length; i<n; i++){
                        //마커 삭제
                        markersInfo.current[markerEvtOpt.key[i]].setMap(null);
                        //표출마커 Map에서 삭제
                        delete markersInfo.current[markerEvtOpt.key[i]];
                    }
                    break;
                case "click" :
                    const keyList = Object.keys(markersInfo.current);

                    //마커에 클릭 이벤트를 추가
                    for(let i=0, n=keyList.length; i<n; i++){
                        const marker = markersInfo.current[keyList[i]];
                        navermaps.Event.addListener(marker, 'click', function (e) {
                            if(marker.getIcon() === nodeNom){
                                marker.setIcon(nodeEdit);
                            }else{
                                marker.setIcon(nodeNom);
                            }
                        });
                    }
                    break;
                case "clear" :
                    //지도위의 모든 마커 삭제
                    const tempKey = Object.keys(markersInfo.current);
                    for(let i=0, n=tempKey.length; i<n; i++){
                        //마커 삭제
                        markersInfo.current[tempKey[i]].setMap(null);
                        //표출마커 Map에서 삭제
                        delete markersInfo.current[tempKey[i]];
                    }
                    selMarkerInfo.current = [];

                    //추가마커정보 초기화
                    if(insMarkerInfo.current !== null){
                        insMarkerInfo.current.setMap(null);
                        insMarkerInfo.current = null;
                    }

                    //수정마커정보 초기화
                    if(updMarkerInfo.current !== null){
                        updMarkerInfo.current.setMap(null);
                        updMarkerInfo.current = null;
                    }
                    break;
            }
        }
    }, [markerEvtOpt])
    /******************** 마커 관련 기능 End ********************/

    /******************** 폴리라인 관련 기능 ********************/
    //지도에 기본 폴리라인 추가
    useEffect(() => {
        if(polylineAddOpt !== undefined && Object.keys(polylineAddOpt).length > 0){
            //polylineAddOpt 있는 경우
            const key = polylineAddOpt.key;
            const data = polylineAddOpt.data;

            for(let i=0, n=data.length; i<n; i++){
                // 폴리라인 표출
                const polyline = new navermaps.Polyline({
                    path: data[i].linkVtx,
                    strokeWeight: 5,         //선 두께
                    strokeColor: '#808080',  //선 색상
                    strokeOpacity: 0.9,      //선 불투명도
                    strokeLineCap: 'round',  //선 마감 스타일
                    strokeLineJoin: 'round', //선들이 맞닿는 부분의 마감 스타일
                    clickable: true          //폴리라인에 클릭 이벤트를 사용시 필수로 추가해야함
                });
                polyline["polylineId"] = data[i][key];//polyline에 key추가

                polyline.setMap(map.current);//폴리라인 표출

                polylinesInfo.current[data[i][key]] = polyline;
            }
        }
    }, [polylineAddOpt])

    //폴리라인 이벤트 처리
    useEffect(() => {
        if(polylineEvtOpt !== undefined && Object.keys(polylineEvtOpt).length > 0){
            switch(polylineEvtOpt.type){
                case "select" :
                    //기존 선택 폴리라인이 있는 경우 제거
                    for(const key in selPolylineInfo.current){
                        const polyline = selPolylineInfo.current[key];

                        if(polyline){
                            polyline.setMap(null); // 지도에서 제거
                            delete selPolylineInfo.current[key]; // selPolylineInfo에서 제거
                        }
                    }

                    //폴리라인 select 이벤트
                    for(let i=0, n=polylineEvtOpt.key.length; i<n; i++){
                        const polyline = new navermaps.Polyline({
                            path: polylinesInfo.current[polylineEvtOpt.key[i]]?.getPath(),
                            strokeWeight: 5,             //선 두께
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.9,          //선 불투명도
                            strokeLineCap: 'round',      // 선 마감 스타일
                            strokeLineJoin: 'round',     // 선들이 맞닿는 부분의 마감 스타일
                            zIndex : 100
                        });

                        polyline["polylineId"] = polylinesInfo.current[polylineEvtOpt.key[i]]?.polylineId;
                        polyline.setMap(map.current);// 지도에 추가

                        //폴리라인 마커 HashMap에 저장
                        selPolylineInfo.current[polylineEvtOpt.key[i]] = polyline;
                    }
                    break;
                case "unSelect" :
                    //폴리라인 unSelect 이벤트
                    for (const key in selPolylineInfo.current) {
                        const polyline = selPolylineInfo.current[key];

                        if (polyline) {
                            polyline.setMap(null); // 지도에서 제거
                            delete selPolylineInfo.current[key]; // selPolylineInfo에서 제거
                        }
                    }
                    break;
                case "delete" :
                    //폴리라인 삭제 이벤트 => unselect와 동일기능 변경 고민
                    for (const key in selPolylineInfo.current) {
                        const polyline = selPolylineInfo.current[key];

                        if (polyline) {
                            polyline.setMap(null); // 지도에서 제거
                            delete selPolylineInfo.current[key]; // selPolylineInfo에서 제거
                        }
                    }
                    break;
                case "click" :
                    //폴리라인에 클릭 이벤트를 추가 - 폴리라인 색깔 변경
                    const keyList = Object.keys(polylinesInfo.current);

                    for(let i=0, n=keyList.length; i<n; i++){
                        const polyline1 = polylinesInfo.current[keyList[i]];
                        
                        navermaps.Event.addListener(polyline1, 'click', function (e) {
                            //폴리라인 선택 이벤트
                            const polyline2 = new navermaps.Polyline({
                                path: polyline1.getPath(),
                                strokeWeight: 5,             //선 두께
                                strokeColor: '#FF0000',
                                strokeOpacity: 0.9,          //선 불투명도
                                strokeLineCap: 'round',      // 선 마감 스타일
                                strokeLineJoin: 'round',     // 선들이 맞닿는 부분의 마감 스타일
                                zIndex : 100,
                                clickable : true
                            });

                            polyline2["polylineId"] = keyList[i];

                            polyline2.setMap(map.current);// 지도에 추가

                            //폴리라인 마커 HashMap에 저장
                            selPolylineInfo.current[keyList[i]] = polyline2;

                            //선택한 폴리라인 클릭시에는 기본 폴리라인 표출
                            navermaps.Event.addListener(polyline2, 'click', function (e) {
                                selPolylineInfo.current[e.overlay.polylineId].setMap(null);
                                // selPolylineInfo에서 제거
                                delete selPolylineInfo.current[e.overlay.polylineId];
                            });
                        });
                    }
                    break;
                case "edit" :
                    // Edit 이벤트를 사용하기 위해서 DrawingManager 필요
                    // drawingManager.current = new navermaps.drawing.DrawingManager({map: map.current});

                    if(drawingManager.current !== null){
                        drawingManager.current.addDrawing(polylinesInfo.current[polylineEvtOpt.key], navermaps.drawing.DrawingMode.POLYLINE, polylineEvtOpt.key);
                        navermaps.Event.addListener(map.current, 'mousemove', function (e) {
                            //수정된 폴리라인 관련하여 추가처리 필요시 로직 추가
                            // const key = Object.keys(drawingManager.current.getDrawings())[0];
                            // const drawingData = drawingManager.current.getDrawings()[key];
                        });
                    }
                    break;
            }
        }
    }, [polylineEvtOpt])
    /******************** 폴리라인 관련 기능 End ********************/

    return (
        <div id={mapId} style={{width: "1900px", height: "900px", marginLeft: "10px"}}></div>
    );
};

export default CompNaverMap;