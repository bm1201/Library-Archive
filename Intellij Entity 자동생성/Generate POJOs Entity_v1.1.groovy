import com.intellij.database.model.DasTable
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import javax.swing.*
import java.text.SimpleDateFormat
import java.time.LocalDateTime

/**
 * Entity 자동생성<br />
 */

/**
 * Available Function:
 * 1. 파일 Directory명으로 PackageName 생성 및 선언
 * 2. Entity명은 DB 테이블 명
 * 3. KeyEntity명은 DB 테이블 명 + "_KEY"
 * 4. Lombok 형태로 테이블 컬럼 표출
 */

/**
 * How to use:
 * 1. PROJECT_NO 변경
 * 2. PROJECT_SETTING 정보 확인
 * + @CreationTimestamp 붙여줄 컬럼명 정보 확인
 * + @UpdateTimestamp 붙여줄 컬럼명 정보 확인
 *
 * + 프로젝트 정보 확인 - 적용할 프로젝트명으로 수정 (파일 import 자동 작성으로 필요)
 * + 파일 수정 여부 구분자 확인
 * + 엔티티 키 규칙 타입 확인 - 엔티티 키 규칙에 맞게 수정
 * + 타입 포맷 매핑 처리 정보 확인 - 타입 포맷 매핑 처리 방법에 맞게 수정
 * + db 정보 확인 - 개발하려는 db 정보에 맞게 수정
 * + 테이블에 key가 없을 때 처리 방법 확인
 */


// ----------수정 필요----------
//프로젝트 번호
PROJECT_NO = 1

//PROJECT_SETTING는 초기에만 설정하면 수정할 필요 없음
PROJECT_SETTING = [
        1 : [
                projectName : "test1",
                entityKeyRule : 1,                  // 1 : 엔티티 키 규칙 - key 여러개인 경우에만 @EmbeddedId 사용
                typeMappingRule : 1,                // 1 : 타입 포맷 매핑 - mapper에서 처리
                dbInfo : 1,                         // 1 : db 정보 - Oracle
                noKeyHandleType : 1                 // 1 : 테이블에 key가 없을 때 - 키 관련 부분 비워두고 주석처리
        ],
        2 : [
                projectName : "test2",
                entityKeyRule : 2,                  // 2 : 엔티티 키 규칙 - 무조건 @EmbeddedId 사용
                typeMappingRule : 1,                // 1 : 타입 포맷 매핑 - mapper에서 처리
                dbInfo : 2,                         // 2 : db 정보 - PostgreSQL
                noKeyHandleType : 2                 // 2 : 테이블에 key가 없을 때 - 모든 컬럼을 키로 설정
        ]
]

//@CreationTimestamp 붙여줄 컬럼명 지정
CREATION_ANNOTAION_COLUMN = ["regDt, regDtm", "cretDt", "cretDtm"]

//@UpdateTimestamp 붙여줄 컬럼명 지정
UPDATE_ANNOTAION_COLUMN = ["updDt", "updDtm", "altrDt", "altrDtm"]

//파일 수정 여부 구분자
NEW_FILE_DIV = "//created file - 📢📢📢❌수정 시 삭제!!!!! 안 지우면 덮어쓰기 될 수 있음!!!!!❌📢📢📢"

//---------END-----------


//프로젝트 정보 (프로젝트 명)
PROJECT_NAME = PROJECT_SETTING[PROJECT_NO]['projectName']

//엔티티 키 규칙 타입 정보
// 1 : key 여러개인 경우에만 @EmbeddedId 사용
// 2 : 무조건 @EmbeddedId 사용
ENTITY_KEY_RULE = PROJECT_SETTING[PROJECT_NO]['entityKeyRule']

//타입 포맷 매핑 처리 정보
// 1 : mapper에서 처리
TYPE_MAPPING_RULE = PROJECT_SETTING[PROJECT_NO]['typeMappingRule']

//db 정보
// 1 : Oracle
// 2 : PostgreSQL
DB_INFO = PROJECT_SETTING[PROJECT_NO]['dbInfo']

//테이블에 key가 없을 때 처리 방법
// 1 : 키 관련 부분 비워두고 주석처리 - 직접 수정해야함
// 2 : 모든 컬럼을 키로 설정
NO_KEY_HANDLE_TYPE = PROJECT_SETTING[PROJECT_NO]['noKeyHandleType']


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
                //파일 새로 생성할지 여부
                def isNewFile = checkFileNew(dir, fileName)

                if(isNewFile){
                    //Entity생성
                    new File(dir, fileName + ".java").withPrintWriter { out -> generateEntity1(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) }
                }

                break;
            }
        case 2 :    //@EmbeddedId 필수 or @EmbeddedId 필수가 아닌데 key가 여러개(case 1에서 break 안 타고 내려옴)
            //파일 새로 생성할지 여부
            def isNewFile = checkFileNew(dir, fileName)

            if(isNewFile){
                //Entity생성
                new File(dir, fileName + ".java").withPrintWriter { out -> generateEntity2(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) }
            }

            //key파일 새로 생성할지 여부
            keyDir = dir.toString() + "\\" +"key"
            mkDirectory(keyDir)

            def isNewKeyFile = checkFileNew(keyDir, fileName + "_KEY")

            if(isNewKeyFile){
                //KeyEntity생성
                new File(keyDir, fileName + "_KEY.java").withPrintWriter { out -> generateEntityKey(out, fileName + "_KEY", tableName, tableSchema, tableComment, fields, fieldsInfo, keyDir) }
            }

            break;
    }

}

//Entity 생성 설정
def generateEntity1(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) {
    //패키지명
    def packageName = setPackageNm(dir)

    out.println "package $packageName;"
    out.println "${NEW_FILE_DIV}"
    out.println ""
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
    out.println ""
    out.println "/**"
    if (tableComment != null) { //테이블 코멘트가 있으면 해당 코멘트로 주석 채워줌
        out.println " * [${tableComment}] Entity<br />"
    } else{
        out.println " * [] Entity<br />"
    }
    out.println " *"
    out.println " * @author "
    out.println " * @since ${FORMATTEDDATE}<br />"
    out.println " * ------수정이력--------<br />"
    out.println " */"
    out.println ""
    out.println "@Getter"
    out.println "@Setter"
    out.println "@Entity"
    if(DB_INFO == 2){
        //DB가 PostgreSQL
        out.println "@Table(name = \"\\\"$tableName\\\"\", schema=\"$tableSchema\")"
    }else{
        out.println "@Table(name = \"$tableName\")"
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
        out.println "    private ${it.type} ${it.name};"
        out.println ""
    }
    out.println "}"
}

//Entity 생성 설정
def generateEntity2(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) {
    //패키지명
    def packageName = setPackageNm(dir)

    def strPk = ""
    def strField = ""

    //필드 세팅
    fields.each() {
        if (it.pk) {
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
            strField += "    private ${it.type} ${it.name};\n"
            strField += "\n"
        }
    }

    out.println "package $packageName;"
    out.println "${NEW_FILE_DIV}"
    out.println ""
    out.println "import ${packageName}.key.${tableName}_KEY;"
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
    out.println ""
    out.println "/**"
    if (tableComment != null) { //테이블 코멘트가 있으면 해당 코멘트로 주석 채워줌
        out.println " * [${tableComment}] Entity<br />"
    } else{
        out.println " * [] Entity<br />"
    }
    out.println " *"
    out.println " * @author "
    out.println " * @since ${FORMATTEDDATE}<br />"
    out.println " * ------수정이력--------<br />"
    out.println " */"
    out.println ""
    out.println "@Getter"
    out.println "@Setter"
    out.println "@Entity"
    if(DB_INFO == 2){
        //DB가 PostgreSQL
        out.println "@Table(name = \"\\\"$tableName\\\"\", schema=\"$tableSchema\")"
    }else{
        out.println "@Table(name = \"$tableName\")"
    }
    out.println "public class $fileName implements Serializable {"
    out.println ""
    out.println "    /* 키 */"
    out.println "    @EmbeddedId"
    out.println "    private ${tableName}_KEY key;"
    out.println ""
    out.println ""
    out.println strField
    out.println "}"
}

//KeyEntity 생성 설정
def generateEntityKey(out, fileName, tableName, tableSchema, tableComment, fields, fieldsInfo, dir) {
    def packageName = setPackageNm(dir)

    out.println "package $packageName;"
    out.println "${NEW_FILE_DIV}"
    out.println ""
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
    out.println ""
    out.println "/**"
    if (tableComment != null) { //테이블 코멘트가 있으면 해당 코멘트로 주석 채워줌
        out.println " * [${tableComment}] Entity Key<br />"
    } else{
        out.println " * [] Entity Key<br />"
    }
    out.println " *"
    out.println " * @author "
    out.println " * @since ${FORMATTEDDATE}<br />"
    out.println " * ------수정이력--------<br />"
    out.println " */"
    out.println ""
    out.println "@Getter"
    out.println "@Setter"
    out.println "@AllArgsConstructor"
    out.println "@NoArgsConstructor"
    out.println "@EqualsAndHashCode"
    out.println "@Embeddable"
    out.println "public class $fileName" + " implements Serializable {"
    out.println ""
    out.println "    private static final long serialVersionUID = 1L;"
    out.println ""
    if(fieldsInfo.primaryKey.size() == 0){
        out.println "    private String identity; //실제 키 값으로 변경 필요"
    } else{
        fields.each() {
            if (it.pk) {
                if (it.comment != "" && it.comment != null) {   //컬럼 코멘트 있으면 코멘트관련 주석 추가
                    out.println "    /* ${it.comment} */"
                }
                if(DB_INFO == 2){
                    out.println "    @Column(name = \"\\\"${it.oriName}\\\"\")"
                }else{
                    out.println "    @Column(name = \"${it.oriName}\")"
                }
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
        } else if(i == 1 && name.length() == 1) {   //두번째 글자가 대문자면 매퍼에서 오류남...
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
            importCreationTimestamp : false,
            importUpdateTimestamp : false,
            importBlob : false,
            importClob : false
    ]

    fields.each() {
        if(it.pk){  //pk 컬럼
            info.primaryKey.add(it.name)
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

        if(isCreationTimeColumn(it.name)){  //@CreationTimestamp 붙여줘야 하는 컬럼
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
            }
        }
    }
    if(NO_KEY_HANDLE_TYPE == 2){
        //key, index 모두 없다면 전체 컬럼을 키로 설정
        if(info.primaryKey.size() == 0){
            fields.each() {
                it.pk = true
                info.primaryKey.add(it.name)
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

//필드 Type 설정 함수
def setType(oriType) {
    int s = oriType.indexOf("(") == -1 ? oriType.length() : oriType.indexOf("(");
    def type = "CHAR, VARCHAR2, NCHAR, NVARCHAR, varchar, char, geometry"
    def type2 = "NUMBER, FLOAT, numeric, float4, float8"
    def type3 = "smallint, integer, bigint"
    def typeStr = ""

    if(s !== -1){
        def typeNm = oriType.substring(0, s-1)

        if(type.contains(typeNm)){
            //문자열
            typeStr = "String"
            return typeStr
        }else if(type2.contains(typeNm)){
            //실수
            typeStr = "Double"
            return typeStr
        }else if(type3.contains(typeNm)){
            //정수
            typeStr = "Long"
            return typeStr
        }else{
            typeStr = "String"
            return typeStr
        }
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

//파일이 수정 안 한 새 파일인지 확인하는 함수
def checkFileNew(dir, fileName){
    def isNew = true;
    def realFileNm = fileName + ".java" //실제 full 파일 이름

    File newFile = new File(dir, realFileNm);

    //파일 있는지 확인
    if(newFile.exists()){
        def line = ""
        def lineNo = 0

        //파일 내용 확인
        newFile.withReader { reader ->
            while ((line = reader.readLine()) != null) {
                lineNo++
                if(lineNo == 2){   //두번째 줄까지만 확인
                    if(!line.contains(NEW_FILE_DIV)){   //파일 수정됨
                        isNew = false;  //파일이 수정되었으면 파일 생성 안 함
                    }
                    break;
                }
            }
        }
    }

    return isNew;
}