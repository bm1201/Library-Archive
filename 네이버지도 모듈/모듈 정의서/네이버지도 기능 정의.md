### 사용방법
    1. 옵션 및 속성값을 NaverMapContainer에 props로 전송

### 지원기능
    1. mapZoomSize
    - 기능 : 원하는 지도크기를 설정할 수 있다

    - 형태
    mapZoomSize: ""

    ex) mapZoomSize: "16"
    
    2. marker 표출함수
    -기능 : data를 기반으로 key를 PK로 갖는 마커를 지도위에 생성

    -형태(모든 속성값 필수입력)
    fnMarker : {
        key   : "",                   // 마커 key 컬럼 지정 => PK의 역할
        coord : {lon : "", lat : ""}, // 마커 좌표(위도, 경도) 컬럼 지정
        data  : []                    // 마커 데이터
    },

    ex) fnMarker : {
            key  : "nodeId",
            coord : {lon : "lon", lat : "lat"},
            data : [
                {
                    "nodeId" : "3140013700",
                    "lon"    : 127.5325581,
                    "lat"    : 35.99196044
                },
                ...
            ]
        }
        new navermaps.LatLng([35.99196044, 127.5325581])위치에 nodeId의 값을 PK로 가진 마커 생성
    
    3. marker 관련 이벤트 함수
    -기능 : 지도에 표출된 마커 중 data와 동일한 데이터를 가진 마커에 이벤트처리
    
    -형태
    fnMarkerEvt : {
        type : "", //이벤트 타입 지정 (필수)
        data : []  //이벤트 실행할 데이터 (선택)
    }

    -type 종류
    ADD    : 지도에서 클릭한 위치에 추가마커를 생성한다.

    EDIT   : 지도에서 클릭한 위치에 편집마커를 생성한다.
    => SELECT 데이터가 존재해야지만 정상작동

    SELECT : data와 동일한 데이터를 가진 마커를 선택마커로 변경하고 해당 마커의 위치로 지도 이동

    CANCEL : 지도 위의 모든 마커 및 이벤트 초기화

    SEARCH : 지도 위의 모든 마커 및 이벤트 초기화
    
    4. polyLine 표출함수
    -기능 : data의 vtx데이터를 기반으로 key를 PK로 갖는 회색 폴리라인을 지도위에 생성

    -형태(모든 속성값 필수입력)
    fnPolyLine : {
        key  : "",      // 폴리라인 key 컬럼 지정 => PK의 역할
        data : [],      // 폴리라인 데이터
        vtx : 'linkVtx' // vtx값이 들어있는 컬럼값 지정
    },

    ex) fnPolyLine : {
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
            vtx : 'linkVtx'
        }
        
        linkVtx를 기반으로 linkId 값을 PK로 가진 회색 폴리라인 생성
    
    -참고사항
        linkVtx의 경우 데이터 형태가 [lon, lat]이여야한다.

    5. polyLine 관련 이벤트 함수
    -기능 : data와 동일한 데이터를 가진 폴리라인에 이벤트처리
     참고) 수정기능 사용시 네이버지도 &submodules=drawing 추가 필수
    
    -형태
    fnPolyLineEvt : {
        type : "", //이벤트 타입 지정 (필수)
        data : []  //이벤트 실행할 데이터 (선택)
    }

    -type 종류
    SELECT : data와 동일한 데이터를 가진 빨간색 폴리라인을 지도 위에 생성한다.
    EDIT   : 선택된 폴리라인을 편집 할 수 있게 된다.
    CANCEL : 지도 위의 모든 폴리라인 및 이벤트 초기화

    6. 지도 크기 내의 모든 노드 및 폴리라인 표출 함수
    -기능 : 지도 크기 내의 모든 폴리라인 또는 마커를 생성함

    -형태(fnMinMax.flag가 true인 경우 실행)
    fnMinMax: {
        "marker"   : { url: ""  , key : "", flag: true/false },
        "polyLine" : { url: "", key : "", flag: true/false },
        "flag"     : false
    },

    -참고사항
        1. fnMinMax를 사용하기 위해서는 예시의 형태로 mapCenter 옵션이 필요함
        ex) mapCenter : { "lat": 36.3504119, "lon": 127.3845475 }

        2. url 조회시 데이터 안에 lat, lon, linkVtx 가 있어야함

        3. 지도 드래그 시 변경된 위치의 노드 또는 폴리라인 재표출

    7. MinMax로 표출된 marker 관련 이벤트 함수
    -기능 : 지도에 표출된 마커 중 data와 동일한 데이터를 가진 마커에 이벤트처리
    
    -형태
    fnMarkerEvt : {
        type : "", //이벤트 타입 지정 (필수)
        data : []  //이벤트 실행할 데이터 (선택)
    }

    -type 종류
    ADD    : 지도에서 클릭한 위치에 추가마커를 생성한다.

    EDIT   : 지도에서 클릭한 위치에 편집마커를 생성한다.
    => SELECT 데이터가 존재해야지만 정상작동

    SELECT : data와 동일한 데이터를 가진 마커를 선택마커로 변경하고 해당 마커의 위치로 지도 이동

    CANCEL : 지도 위의 모든 마커 및 이벤트 초기화

    SEARCH : 지도 위의 모든 마커 및 이벤트 초기화

    8. MinMax로 표출된 polyLine 관련 이벤트 함수
    -기능 : data와 동일한 데이터를 가진 폴리라인에 이벤트처리
     참고) 수정기능 사용시 네이버지도 &submodules=drawing 추가 필수
    
    -형태
    fnPolyLineEvt : {
        type : "", //이벤트 타입 지정 (필수)
        data : []  //이벤트 실행할 데이터 (선택)
    }

    -type 종류
    SELECT : data와 동일한 데이터를 가진 빨간색 폴리라인을 지도 위에 생성한다.
    EDIT   : 선택된 폴리라인을 편집 할 수 있게 된다.
    CANCEL : 지도 위의 모든 폴리라인 및 이벤트 초기화
