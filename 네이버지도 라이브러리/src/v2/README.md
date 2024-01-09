### Update Note
1. mapId만 다르면 지도컨포넌트를 재사용할 수 있도록 수정
2. 데이터를 HashMap 형태로 저장하여 특정데이터를 찾을 때 v1처럼 배열 전체를 순환하지 않아 속도개선
3. 특정 줌 사이즈를 넘어가면 지도의 마커, 폴리라인 표출되지 않음
4. MinMax관련 소스 제거

### 사용방법
    1. 옵션값을 CompNaverMap에 props로 전송

### 지원기능
    /******************** 공통기능 ********************/
    1. 네이버지도 생성
    - 지도 옵션값에 따라 네이버지도 생성(지도 옵션은 https://navermaps.github.io/maps.js.ncp/docs/tutorial-digest.example.html 참고)
    - 지도 생성시 지도크기를 상위 컨포넌트로 리턴
    ex) [
            {
                "field": "minX",
                "value": 126.6525468
            },
            {
                "field": "maxX",
                "value": 126.8156252
            },
            {
                "field": "minY",
                "value": 37.6845729
            },
            {
                "field": "maxY",
                "value": 37.7456805
            }
        ]
    - 특정 줌 size 이하일때는 마커와 폴리라인 표출하지 않음

    2. 지도 중심 이동
    - 옵션명 : mapCenterLonLat
    - 기능 : props로 받은 위경도 좌표로 지도 중심 이동
    - 형태 : [경도, 위도]
    ex) [126.734086, 37.715133]

    3. 지도 줌 변경
    - 옵션명 : zoomSize
    - 기능 : props로 받은 zoomSize로 지도 zoom 변경
    - 형태 : 16
    /******************** 공통기능 End ********************/

    /******************** 마커 관련 기능 ********************/
    1. 지도에 기본마커 추가
    - 옵션명 : markerAddOpt
    - 기능 : data를 기반으로 key를 PK로 갖는 마커를 지도위에 생성(HashMap으로 생성)

    - 형태(모든 속성값 필수입력)
    markerAddOpt : {
        key   : "",                   // 마커 key 컬럼 지정 => PK의 역할
        coord : {lon : "", lat : ""}, // 마커 좌표(위도, 경도) 컬럼 지정
        data  : []                    // 마커 데이터
    },
    ex) markerAddOpt : {
            key  : "nodeId",
            coord : {lon : "lon", lat : "lat"},
            data : [
                {
                    "nodeId" : "test",
                    "lon"    : 126.734086,
                    "lat"    : 37.715133
                },
                ...
            ]
        }

    2. 마커 관련 이벤트 처리
    - 옵션명 : markerEvtOpt
    - 형태
    markerEvtOpt : {
        type : "", //이벤트 타입 지정 (필수)
        key  : []  //이벤트 실행할 데이터 키값
        func : (e) => {} //이벤트에서 실행시킬 함수 ex) 폼의 데이터변경등
    }
    
    - type 종류
    "select" : data와 같은 키를 가진 마커를 선택마커로 변경하고 해당 마커의 위치로 지도 이동
    ex) markerEvtOpt : {
        type : "select", 
        key  : ["test"] //선택마커로 변경할 마커의 키를 입력(2개 이상인 경우 ["test", "test1", ...])
    }

    "unSelet" : 기존 선택마커가 있는 경우 기본마커로 변경
    ex) markerEvtOpt : {
        type : "unSelet"
    }

    "insert"  : 지도에서 클릭한 위치에 추가마커를 생성한다.
    ex) markerEvtOpt : {
        type : "insert"
        func : (e) => {}
    }

    "update"  : 지도에서 클릭한 위치에 편집마커를 생성한다.
    ex) markerEvtOpt : {
        type : "update"
        func : (e) => {}
    }

    "delete"  : data와 같은 키를 가진 마커를 지도에서 삭제
    ex) markerEvtOpt : {
        type : "delete"
        key  : ["test"] //삭제할 마커의 키를 입력(2개 이상인 경우 ["test", "test1", ...])
    }

    "click"  : 지도의 마커에 클릭 이벤트를 추가
        ex) markerEvtOpt : {
        type : "click"
    }
    /******************** 마커 관련 기능 End ********************/
    
    /******************** 폴리라인 관련 기능 ********************/
    1. 지도에 기본 폴리라인 추가
    - 옵션명 : polylineAddOpt
    - 기능   : data의 linkVtx 데이터를 기반으로 key를 PK로 갖는 회색 폴리라인을 지도위에 생성

    - 형태(모든 속성값 필수입력)
    polylineAddOpt : {
        key  : "",      // 폴리라인 key 컬럼 지정 => PK의 역할
        data : [],      // 폴리라인 데이터
    },

    ex) polylineAddOpt : {
            key  : "linkId",
            data : [
                {
                    "linkId": "1830000301",
                    "linkVtx": [
                        [
                            127.4507049,
                            36.20007193
                        ],
                        [
                            127.4503577,
                            36.20029
                        ],
                        [
                            127.4493091,
                            36.20086143
                        ],
                        [
                            127.4489228,
                            36.20101687
                        ],
                        [
                            127.4487666,
                            36.20112509
                        ]
                    ]
                },
                ...
            ],
        }
    - 참고사항 : linkVtx의 경우 데이터 형태가 [lon, lat]이여야한다.

    1. polyLine 관련 이벤트 함수
    - 옵션명 : polylineEvtOpt
    - 기능 : data와 동일한 데이터를 가진 폴리라인에 이벤트처리
    - 형태
    polylineEvtOpt : {
        type : "", //이벤트 타입 지정 (필수)
        key  : []  //이벤트 실행할 데이터 (선택)
    }

    - type 종류
    "select" : data와 같은 키를 가진 폴리라인 위에 빨간색 폴리라인 생성
    ex) polylineEvtOpt : {
        type : "select", 
        key  : ["test"] //선택마커로 변경할 마커의 키를 입력(2개 이상인 경우 ["test", "test1", ...])
    }

    "unSelet" : 빨간색 폴리라인이 있는 경우 해당 폴리라인 삭제
    ex) polylineEvtOpt : {
        type : "unSelet"
    }

    "delete"  : key 같은 키를 가진 폴리라인을 지도에서 삭제
    ex) polylineEvtOpt : {
        type : "delete"
        key  : ["test"] //삭제할 마커의 키를 입력(2개 이상인 경우 ["test", "test1", ...])
    }

    "click"  : 지도의 회색 폴리라인에 클릭 이벤트를 추가
    ex) polylineEvtOpt : {
        type : "click"
    }

    "edit"  : 지도의 마커에 수정 이벤트를 추가
    ex) polylineEvtOpt : {
        type : "edit",
        key : ["test3"]
    }

    - 참고사항 : 수정기능 사용시 네이버지도 &submodules=drawing 추가 필수
    /******************** 폴리라인 관련 기능 End ********************/
