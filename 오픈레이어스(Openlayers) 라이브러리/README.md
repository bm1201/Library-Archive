### Openlayers Library
- **last released version : v2**
- **update note**
#### 함수추가  
   - setVisibleEvt(layer) - 전달받은 레이어 보여주기  
   - setVisibleAllEvt() - 모든 레이어 보여주기  
   - setHiddenAllEvt() - 모든 레이어 숨기기  
   - changeCanvas() - TileLayer를 교체하는 방법으로 라이트/다크모드 변경  
   - moveEvt() - spd(속도)로 route(이동경로)대로 ftr(이동 마커)이 이동하는 함수  

#### 기능개선 및 수정  
   - addLayer함수에 heatmap타입 추가  
   - 우리나라 유효좌표 밖에 있는 좌표의 경우 표출하지 않는 기능 추가
     (우리나라 유효좌표 (124.5 < lon < 132.0) / (33 < lat < 38.9), addFeature 참고)  
   - addFeature함수에 addPolyline함수 통합 및 히트맵마커 표출기능 추가  
   - 폴리라인 클릭 시 오류 처리 (layer.values_ -> layer?.values_)  
   - 레이어 클릭 시 overlay 모두 삭제 처리  
   - addFeature(), addPolyline()에서 type 정보도 저장  
   - 마커 클릭 시 커서 포인터로 변경  
   - addFeature()에서 data에 해당 feature의 정보도 저장  
   - addPolyline()에서 data에 해당 polyline의 정보도 저장  

### 예시소스
- https://github.com/bm1201/openLayers-test
