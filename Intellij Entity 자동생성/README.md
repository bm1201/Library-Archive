# Intellij Entity자동생성 방법, DTO도 동일한 방법으로 생성(4번에서 파일명을 입력)

1. DataBase를 연결
2. Generate POJOs.groovy 파일소스를 변경
   => 파일위치 : Scratches and Consoles/Extensions/Database Tools and SQL/schema
   ![image](https://github.com/bm1201/OpenSource/assets/87167038/919a2437-668a-4759-a42e-0f57add4301f)

3. Entity를 만들고 싶은 테이블에 우클릭 -> Tools -> Scripted Extensions -> Generate POJOs.groovy 선택
   ![image](https://github.com/bm1201/OpenSource/assets/87167038/e533a31b-97d5-4aa1-9075-da89f620f668)
   
4. 테이블의 KEY 컬럼을 입력

   ![image](https://github.com/bm1201/OpenSource/assets/87167038/a6f2db5d-21e1-4911-a9b6-6acf4a85a195)
   
5. Entity생성 디렉토리 선택

   ![image](https://github.com/bm1201/OpenSource/assets/87167038/5b1642f6-836c-408b-80a3-0c7047e8b862)

6. Entity와 KeyEntity 생성

   ![image](https://github.com/bm1201/OpenSource/assets/87167038/45261263-f2ff-4f31-9108-73b715bddb60)
