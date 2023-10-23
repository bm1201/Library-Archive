import com.intellij.database.model.DasTable
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import javax.swing.*
import java.text.SimpleDateFormat
import java.time.LocalDateTime

/**
 * Available Function:
 * 1. 파일 Directory명으로 PackageName 생성 및 선언
 * 2. Entity명은 DB 테이블 명
 * 3. KeyEntity명은 DB 테이블 명 + "_KEY"
 * 4. Lombok 형태로 테이블 컬럼 표출
 */

/**
 * To do
 * 1. db별 컬럼 타입 정리
 */

/**
 * How to use:
 * 1. PROJECT_NO 변경
 * 2. PROJECT_SETTING 정보 확인
 * + @CreationTimestamp 붙여줄 컬럼명 정보 확인
 * + @UpdateTimestamp 붙여줄 컬럼명 정보 확인
 *
 * + 프로젝트 정보 확인 - 적용할 프로젝트명으로 수정 (파일 import 자동 작성으로 필요)
 * + 엔티티 키 규칙 타입 확인 - 엔티티 키 규칙에 맞게 수정
 * + 타입 포맷 매핑 처리 정보 확인 - 타입 포맷 매핑 처리 방법에 맞게 수정
 * + db 정보 확인 - 개발하려는 db 정보에 맞게 수정
 * + 테이블에 key가 없을 때 처리 방법 확인
 * + 파일 덮어쓰기 처리 방법 확인
 */


/*********** 수정 필요 ***********/

//PROJECT_SETTING
PROJECT_SETTING = [
        projectName : "test",
        entityKeyRule : 1,                  // 1 : 엔티티 키 규칙 - key 여러개인 경우에만 @EmbeddedId 사용
        dbInfo : 1,                         // 1 : db 정보 - Oracle
        /*
        projectName : "test",
        entityKeyRule : 2,                  // 2 : 엔티티 키 규칙 - 무조건 @EmbeddedId 사용
        dbInfo : 2,                         // 2 : db 정보 - PostgreSQL
        */
]

//@CreationTimestamp 붙여줄 컬럼명 지정
CREATION_ANNOTAION_COLUMN = ["regDt, regDtm", "cretDt", "cretDtm"]

//@UpdateTimestamp 붙여줄 컬럼명 지정
UPDATE_ANNOTAION_COLUMN = ["updDt", "updDtm", "altrDt", "altrDtm"]

/*********************************/


//프로젝트 정보 (프로젝트 명)
PROJECT_NAME = PROJECT_SETTING['projectName']

//엔티티 키 규칙 타입 정보
// 1 : key 여러개인 경우에만 @EmbeddedId 사용
// 2 : 무조건 @EmbeddedId 사용
ENTITY_KEY_RULE = PROJECT_SETTING['entityKeyRule']

//db 정보
// 1 : Oracle
// 2 : PostgreSQL
DB_INFO = PROJECT_SETTING['dbInfo']

//컬럼 타입 매핑 설정
if(DB_INFO == 1){   //Oracle
    typeMapping = [
            (~/(?i)integer|smallint/)                   : "Long",
            (~/(?i)float|double|decimal|real|number/)   : "Double",
            (~/(?i)timestamp|date|time/)                : "LocalDateTime",
            (~/(?i)blob/)                               : "Blob",
            (~/(?i)clob/)                               : "Clob",
            (~/(?i)/)                                   : "String"
    ]
} else if(DB_INFO == 2){   //PostgreSQL
    typeMapping = [
            (~/(?i)int|int2|int4|int8|smallint|integer|bigint/)             : "Long",
            (~/(?i)real|float4|double precision|float8|numeric|decimal/)    : "Double",
            (~/(?i)date/)                                                   : "LocalDate",
            (~/(?i)timestamp|timestamptz|time|timetz/)                      : "LocalDateTime",
            (~/(?i)bytea/)                                                  : "byte[]",
            (~/(?i)boolean/)                                                : "Boolean",
            (~/(?i)/)                                                       : "String"
    ]
} else {
    typeMapping = [
            (~/(?i)int|smallint|integer|bigint/)                : "Long",
            (~/(?i)float|double|decimal|real|numeric|number/)   : "Double",
            (~/(?i)datetime|timestamp|date|time/)               : "LocalDateTime",
            (~/(?i)blob/)                                       : "Blob",
            (~/(?i)clob/)                                       : "Clob",
            (~/(?i)/)                                           : "String"
    ]
}

//현재 일자
FORMATTEDDATE = new SimpleDateFormat("yyyy-MM-dd").format(new Date())

//파일 저장 위치 선택
FILES.chooseDirectoryAndSave("Choose directory", "Choose where to store generated files") { dir ->
    SELECTION.filter { it instanceof DasTable }.each { generate(it, dir) }
}

def generate(table, dir) {
    //Class이름
    def fileName = table.getName().toUpperCase();
    //테이블이름
    def tableName = table.getName()
    //테이블스키마
    def tableSchema = DasUtil.getSchema(table)
    //테이블코멘트
    def tableComment = table.getComment()
    //key 디렉토리
    def keyDir = ""
    //필드명
    def fields = calcFields(table)
    //필드 관련 정보 가져오기 (key, import 등)
    def fieldsInfo = getFieldsInfo(fields)

    //엔티티 키 규칙에 따라 파일 생성 다름
    switch (ENTITY_KEY_RULE){
        case 1 :
            if(fieldsInfo.primaryKey.size() == 1 || fieldsInfo.primaryKey.size() == 0){ //@EmbeddedId 필수가 아니면서 key가 1개이거나 없을 때
                //Entity생성
                new File(dir, fileName + ".java").withPrintWriter { out -> generateEntity1(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) }
                
                break;
            }
        case 2 :    //@EmbeddedId 필수 or @EmbeddedId 필수가 아닌데 key가 여러개(case 1에서 break 안 타고 내려옴)

            //Entity생성
            new File(dir, fileName + ".java").withPrintWriter { out -> generateEntity2(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) }

            //KeyEntity생성
            keyDir = dir.toString() + "\\" +"key"
            mkDirectory(keyDir)
            
            new File(keyDir, fileName + "_KEY.java").withPrintWriter { out -> generateEntityKey(out, fileName + "_KEY", tableName, tableSchema, tableComment, fields, fieldsInfo, keyDir) }

            break;
    }
}

//Entity 생성 설정
def generateEntity1(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) {
    //패키지명
    def packageName = setPackageNm(dir)

    out.println "package $packageName;"
    out.println ""
    out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.annotation.DefaultSort;"
    if(fieldsInfo.importSaveLocalDateTime){  //날짜타입이면 @SaveLocalDateTime 추가
        out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.annotation.SaveLocalDateTime;"
    }
    out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.annotation.SearchField;"
    out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.enumClass.SortOrder;"
    out.println "import lombok.Getter;"
    out.println "import lombok.Setter;"
    if(fieldsInfo.importCreationTimestamp){
        out.println "import org.hibernate.annotations.CreationTimestamp;"
    }
    if(fieldsInfo.importUpdateTimestamp){
        out.println "import org.hibernate.annotations.UpdateTimestamp;"
    }
    out.println ""
    out.println "import javax.persistence.Column;"
    out.println "import javax.persistence.Id;"
    out.println "import javax.persistence.Entity;"
    out.println "import javax.persistence.Table;"
    out.println "import java.io.Serializable;"
    if(fieldsInfo.importBlob){
        out.println "import java.sql.Blob;"
    }
    if(fieldsInfo.importClob){
        out.println "import java.sql.Clob;"
    }
    if(fieldsInfo.importLocalDate){
        out.println "import java.time.LocalDate;"
    }
    if(fieldsInfo.importLocalDateTime){
        out.println "import java.time.LocalDateTime;"
    }
    out.println ""
//    if(fieldsInfo.importConverter){
//        out.println "import javax.persistence.Convert;"
//        out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.converter.*;"
//    }
    out.println ""
    out.println "/**"
    if (tableComment != null) { //테이블 코멘트가 있으면 해당 코멘트로 주석 채워줌
        out.println " * [${tableComment}] Entity<br />"
    } else{
        out.println " * [] Entity<br />"
    }
    out.println " *"
    out.println " * @author ByungMin"
    out.println " * @since ${FORMATTEDDATE}<br />"
    out.println " * @apiNote <br />"
    out.println " */"
    out.println ""
    out.println "@Getter"
    out.println "@Setter"
    out.println "@Entity"
    if(DB_INFO == 2){
        //DB가 PostgreSQL
//        if(Character.isUpperCase(tableName.charAt(0))){
//            //대문자인 경우
//            out.println "@Table(name = \"$fileName\", schema=\"$tableSchema\")"
//        }else{
//            //소문자인 경우
//            out.println "@Table(name = \"$tableName\")"
//        }
        out.println "@Table(name = \"\\\"$tableName\\\"\", schema=\"$tableSchema\")"
    }else{
        out.println "@Table(name = \"$tableName\")"
    }
    if(fieldsInfo.primaryKey.size() > 1){
        out.println "@DefaultSort(columnName = { ${defaultSort.sortColumnName} }, dir = ${defaultSort.sortDir})"
    }else if(fieldsInfo.primaryKey.size() == 1){
        out.println "@DefaultSort(columnName = \"${defaultSort.sortColumnName}\", dir = SortOrder.DESC)"
    }else{
        out.println "//@DefaultSort(columnName = \"@@@입력필요@@@\", dir = SortOrder.DESC)"
    }
    out.println "public class $fileName implements Serializable {"
    out.println ""
    if(fieldsInfo.primaryKey.size() == 0){    //키, 인덱스 모두 없는 경우 주석 처리
        out.println "    //pk 값 없음!!!! 확인 필요!!!"
        out.println ""
    }
    fields.each() {
        if (it.comment != "" && it.comment != null) {   //컬럼 코멘트 있으면 코멘트관련 주석 추가
            out.println "    /* ${it.comment} */"
        }
        if (it.pk) {    //pk이면 @Id 추가
            if(it.type == 'LocalDate' || it.type == 'LocalDateTime'){   //키 컬럼타입이 날짜타입
                out.println "    @SaveLocalDateTime"
            }
            out.println "    @Id"
        }
        if(isCreationTimeColumn(it.name)){  //@CreationTimestamp 붙여줘야 하는 컬럼인지 확인 후 어노테이션 추가
            if(DB_INFO == 2){
                out.println "    @Column(name = \"\\\"${it.oriName}\\\"\", updatable = false)"
                out.println "    @CreationTimestamp"
            }else{
                out.println "    @Column(name = \"${it.oriName}\", updatable = false)"
                out.println "    @CreationTimestamp"
            }
        } else if(isUpdateTimeColumn(it.name)){  //@UpdateTimestamp 붙여줘야 하는 컬럼인지 확인 후 어노테이션 추가
            if(DB_INFO == 2){
                out.println "    @Column(name = \"\\\"${it.oriName}\\\"\")"
                out.println "    @UpdateTimestamp"
            }else{
                out.println "    @Column(name = \"${it.oriName}\")"
                out.println "    @UpdateTimestamp"
            }
        } else{
            if(DB_INFO == 2){
                out.println "    @Column(name = \"\\\"${it.oriName}\\\"\")"
            }else{
                out.println "    @Column(name = \"${it.oriName}\")"
            }
        }
        out.println "    @SearchField(columnName = \"${it.name}\")"
//        if(TYPE_MAPPING_RULE == 2){ //타입 매핑 룰이 포맷 컨버터 사용
//            def converter = getConverter(it.type)   //컨버터 사용 필요한 타입인지 확인 후 어노테이션 추가
//            if(converter != ''){
//                out.println "    @Convert(converter = ${converter}.class)"
//            }
//        }
        out.println "    private ${it.type} ${it.name};"
        out.println ""
    }
    out.println "}"
}

//Entity 생성 설정
def generateEntity2(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) {
    //패키지명
    def packageName = setPackageNm(dir)

    //defaultSort 세팅
    def defaultSort = getDefaultSort(fieldsInfo.primaryKey)

    def strPk = ""
    def strField = ""

    //필드 세팅
    fields.each() {
        if (it.pk) {    //pk이면 key의 SearchField 부분에 추가되야함.
            if(strPk != ""){
                strPk += ", "
            }
            strPk += "\"key.${it.name}\""
        } else{
            if (it.comment != "" && it.comment != null) {   //컬럼 코멘트 있으면 코멘트관련 주석 추가
                strField += "    /* ${it.comment} */\n"
            }
            if(isCreationTimeColumn(it.name)){  //@CreationTimestamp 붙여줘야 하는 컬럼인지 확인 후 어노테이션 추가
                if(DB_INFO == 2){
                    strField += "    @Column(name = \"\\\"${it.oriName}\\\"\", updatable = false)\n"
                    strField +=  "    @CreationTimestamp\n"
                }else{
                    strField += "    @Column(name = \"${it.oriName}\", updatable = false)\n"
                    strField +=  "    @CreationTimestamp\n"
                }
            } else if(isUpdateTimeColumn(it.name)){  //@UpdateTimestamp 붙여줘야 하는 컬럼인지 확인 후 어노테이션 추가
                if(DB_INFO == 2){
                    strField += "    @Column(name = \"\\\"${it.oriName}\\\"\")\n"
                    strField +=  "    @UpdateTimestamp\n"
                }else{
                    strField += "    @Column(name = \"${it.oriName}\")\n"
                    strField +=  "    @UpdateTimestamp\n"
                }
            } else{
                if(DB_INFO == 2){
                    strField += "    @Column(name = \"\\\"${it.oriName}\\\"\")\n"
                }else{
                    strField += "    @Column(name = \"${it.oriName}\")\n"
                }
            }
            strField += "    @SearchField(columnName = \"${it.name}\")\n"
//            if(TYPE_MAPPING_RULE == 2){ //타입 매핑 룰이 포맷 컨버터 사용
//                def converter = getConverter(it.type)   //컨버터 사용 필요한 타입인지 확인 후 어노테이션 추가
//                if(converter != ''){
//                    strField += "    @Convert(converter = ${converter}.class)\n"
//                }
//            }
            strField += "    private ${it.type} ${it.name};\n"
            strField += "\n"
        }
    }

    out.println "package $packageName;"
    if(NEW_FILE_HANDLE_TYPE == 2){
        out.println "${NEW_FILE_DIV}"
    }
    out.println ""
    out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.annotation.DefaultSort;"
    out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.annotation.SearchField;"
    out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.enumClass.SortOrder;"
    out.println "import ${packageName}.key.${fileName}_KEY;"
    out.println "import lombok.Getter;"
    out.println "import lombok.Setter;"
    if(fieldsInfo.importCreationTimestamp){
        out.println "import org.hibernate.annotations.CreationTimestamp;"
    }
    if(fieldsInfo.importUpdateTimestamp){
        out.println "import org.hibernate.annotations.UpdateTimestamp;"
    }
    out.println ""
    out.println "import javax.persistence.Column;"
    out.println "import javax.persistence.EmbeddedId;"
    out.println "import javax.persistence.Entity;"
    out.println "import javax.persistence.Table;"
    out.println "import java.io.Serializable;"
    if(fieldsInfo.importBlob){
        out.println "import java.sql.Blob;"
    }
    if(fieldsInfo.importClob){
        out.println "import java.sql.Clob;"
    }
    if(fieldsInfo.importLocalDate){
        out.println "import java.time.LocalDate;"
    }
    if(fieldsInfo.importLocalDateTime){
        out.println "import java.time.LocalDateTime;"
    }
    out.println ""
//    if(fieldsInfo.importConverter){
//        out.println "import javax.persistence.Convert;"
//        out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.converter.*;"
//    }
    out.println ""
    out.println "/**"
    if (tableComment != null) { //테이블 코멘트가 있으면 해당 코멘트로 주석 채워줌
        out.println " * [${tableComment}] Entity<br />"
    } else{
        out.println " * [] Entity<br />"
    }
    out.println " *"
    out.println " * @author ByungMin"
    out.println " * @since ${FORMATTEDDATE}<br />"
    out.println " * @apiNote <br />"
    out.println " */"
    out.println ""
    out.println "@Getter"
    out.println "@Setter"
    out.println "@Entity"
    if(DB_INFO == 2){
        //DB가 PostgreSQL
//        if(Character.isUpperCase(tableName.charAt(0))){
//            //대문자인 경우
//            out.println "@Table(name = \"\\\"$fileName\\\"\", schema=\"$tableSchema\")"
//        }else{
//            //소문자인 경우
//            out.println "@Table(name = \"$tableName\")"
//        }
        out.println "@Table(name = \"\\\"$tableName\\\"\", schema=\"$tableSchema\")"
    }else{
        out.println "@Table(name = \"$tableName\")"
    }
    if(fieldsInfo.primaryKey.size() > 1){
        out.println "@DefaultSort(columnName = { ${defaultSort.sortColumnName} }, dir = ${defaultSort.sortDir})"
    }else if(fieldsInfo.primaryKey.size() == 1){
        out.println "@DefaultSort(columnName = \"${defaultSort.sortColumnName}\", dir = SortOrder.DESC)"
    }else{
        out.println "//@DefaultSort(columnName = \"@@@입력필요@@@\", dir = SortOrder.DESC)"
    }
    out.println "public class $fileName implements Serializable {"
    out.println ""
    out.println "    /* 키 */"
    out.println "    @EmbeddedId"
    if(fieldsInfo.primaryKey.size() == 0){    //키, 인덱스 모두 없는 경우 주석 처리
        out.println "    //@SearchField(columnName = { \"@@@입력필요@@@\" })"
    } else{
        out.println "    @SearchField(columnName = { ${strPk} })"
    }
    out.println "    private ${fileName}_KEY key;"
    out.println ""
    out.println ""
    out.println strField
    out.println "}"
}

//KeyEntity 생성 설정
def generateEntityKey(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) {
    def packageName = setPackageNm(dir)

    out.println "package $packageName;"
    if(NEW_FILE_HANDLE_TYPE == 2){
        out.println "${NEW_FILE_DIV}"
    }
    out.println ""
    if(fieldsInfo.importSaveLocalDateTime){  //날짜타입이면 @SaveLocalDateTime 추가
        out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.annotation.SaveLocalDateTime;"
    }
    out.println "import lombok.Getter;"
    out.println "import lombok.Setter;"
    out.println "import lombok.AllArgsConstructor;"
    out.println "import lombok.EqualsAndHashCode;"
    out.println "import lombok.NoArgsConstructor;"
    out.println ""
    out.println "import javax.persistence.Column;"
    out.println "import javax.persistence.Embeddable;"
    out.println "import java.io.Serializable;"
    if(fieldsInfo.importBlob){
        out.println "import java.sql.Blob;"
    }
    if(fieldsInfo.importClob){
        out.println "import java.sql.Clob;"
    }
    if(fieldsInfo.importLocalDate){
        out.println "import java.time.LocalDate;"
    }
    if(fieldsInfo.importLocalDateTime){
        out.println "import java.time.LocalDateTime;"
    }
    out.println ""
//    if(fieldsInfo.importConverter){
//        out.println "import javax.persistence.Convert;"
//        out.println "import kr.co.neighbor21.${PROJECT_NAME}.common.jpa.converter.*;"
//    }
    out.println ""
    out.println "/**"
    if (tableComment != null) { //테이블 코멘트가 있으면 해당 코멘트로 주석 채워줌
        out.println " * [${tableComment}] Entity Key<br />"
    } else{
        out.println " * [] Entity Key<br />"
    }
    out.println " *"
    out.println " * @author ByungMin"
    out.println " * @since ${FORMATTEDDATE}<br />"
    out.println " * @apiNote <br />"
    out.println " */"
    out.println ""
    out.println "@SuppressWarnings(\"serial\")"
    out.println "@Getter"
    out.println "@Setter"
    out.println "@AllArgsConstructor"
    out.println "@NoArgsConstructor"
    out.println "@EqualsAndHashCode"
    out.println "@Embeddable"
    out.println "public class $fileName" + " implements Serializable {"
    out.println ""
    if(fieldsInfo.primaryKey.size() == 0){
        out.println "    private String identity; //실제 키 값으로 변경 필요"
    } else{
        fields.each() {
            if (it.pk) {
                if (it.comment != "" && it.comment != null) {   //컬럼 코멘트 있으면 코멘트관련 주석 추가
                    out.println "    /* ${it.comment} */"
                }
                if(it.type == 'LocalDate' || it.type == 'LocalDateTime'){   //키 컬럼타입이 날짜타입
                    out.println "    @SaveLocalDateTime"
                }
                if(DB_INFO == 2){
                    out.println "    @Column(name = \"\\\"${it.oriName}\\\"\")"
                }else{
                    out.println "    @Column(name = \"${it.oriName}\")"
                }
//                if(TYPE_MAPPING_RULE == 2){ //타입 매핑 룰이 포맷 컨버터 사용
//                    def converter = getConverter(it.type)   //컨버터 사용 필요한 타입인지 확인 후 어노테이션 추가
//                    if(converter != ''){
//                        out.println "    @Convert(converter = ${converter}.class)"
//                    }
//                }
                out.println "    private ${it.type} ${it.name};"
                out.println ""
            }
        }
    }
    out.println "}"
}

//패키지 이름생성 생성함수
def setPackageNm(dir) {
    String s = dir

    String name = s.substring(s.indexOf("java\\") + 5)

    name = name.replaceAll("\\\\", ".")

    return name;
}

//컬럼명 생성함수
def setColumnNm(columnName) {
    def s = columnName.tokenize("_")
    def name = ''
    for(int i=0; i<s.size(); i++) {
        if(i == 0){
            name = name + s[i].toLowerCase()
        } else if(i == 1 && name.length() == 1) {   //두번째 글자가 대문자면 매퍼에서 오류발생
            name = name + s[i].toLowerCase()
        } else {
            name = name + s[i].toLowerCase().capitalize()
        }
    }
    return name;
}

//필드명 생성함수
def calcFields(table) {
    DasUtil.getColumns(table).reduce([]) { fields, col ->
        def spec = Case.LOWER.apply(col.getDataType().getSpecification())
        def typeStr = typeMapping.find { p, t -> p.matcher(spec).find() }.value //타입 확인

        //num으로 시작되는 타입이면 소수점 자리 확인 후 1이상이면 Double로 처리하고 없거나 0이면 Long으로 처리
        //ex) numeric(5,2) -> Double
        //ex) numeric(5,0) -> Long
        //ex) numeric      -> Long
        def oriType = spec.toString().toLowerCase().replace("(","").replace(")","")
        if(oriType.startsWith("num")){
            def tmp = oriType.tokenize(",")
            if(tmp.size() == 1 || tmp[1] == '0'){
                typeStr = "Long"
            } else{
                typeStr = "Double"
            }
        }

        fields += [[
            name : setColumnNm(col.getName()),
            oriName : col.getName(), //실제 데이터타입
            type : typeStr,
            comment : col.getComment(),
            pk : DasUtil.isPrimary(col), //pk 컬럼인지 여부 true/false
            index : DasUtil.isIndexColumn(col)   //index 컬럼인지 여부 true/false
        ]]
    }
}

//필드 import 관련 정보 가져오기
def getFieldsInfo(fields) {
    def info = [
            primaryKey : [],
            importLocalDate : false,
            importLocalDateTime : false,
            importSaveLocalDateTime : false,
            importCreationTimestamp : false,
            importUpdateTimestamp : false,
            importBlob : false,
            importClob : false
    ]

    fields.each() {
        if(it.pk){  //pk 컬럼
            info.primaryKey.add(it.name)
            if(it.type == 'LocalDate' || it.type == 'LocalDateTime'){   //키 컬럼타입이 날짜타입
                info.importSaveLocalDateTime = true
            }
        }

        if(it.type == 'LocalDate') {    //컬럼 타입이 LocalDate
            info.importLocalDate = true
        } else if(it.type == 'LocalDateTime') {    //컬럼 타입이 LocalDateTime
            info.importLocalDateTime = true
        } else if(it.type == 'Blob') {    //컬럼 타입이 Blob
            info.importBlob = true
        } else if(it.type == 'Clob') {    //컬럼 타입이 Clob
            info.importClob = true
        }

        if(isCreationTimeColumn(it.name)){       //@CreationTimestamp 붙여줘야 하는 컬럼
            info.importCreationTimestamp = true
        } else if(isUpdateTimeColumn(it.name)){  //@UpdateTimestamp 붙여줘야 하는 컬럼
            info.importUpdateTimestamp = true
        }
    }

    //key 없으면 index 값이 key 대신
    if(info.primaryKey.size() == 0){
        fields.each() {
            it.pk = it.index;   //index로 pk 설정
            if(it.pk){  //pk 컬럼
                info.primaryKey.add(it.name)
                if(it.type == 'LocalDate' || it.type == 'LocalDateTime'){   //키 컬럼타입이 날짜타입
                    info.importSaveLocalDateTime = true
                }
            }
        }
    }

    return info;
}

//디렉토리를 생성하는 함수
def mkDirectory(dir) {
    File newFile = new File(dir);

    if(!newFile.exists()){
        newFile.mkdir();
    }
}

//등록(생성) 일시인지 체크
def isCreationTimeColumn(column){
    return CREATION_ANNOTAION_COLUMN.contains(column)
}

//수정(변경) 일시인지 체크
def isUpdateTimeColumn(column){
    return UPDATE_ANNOTAION_COLUMN.contains(column)
}
