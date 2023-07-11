import com.intellij.database.model.DasTable
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import javax.swing.*
import java.text.SimpleDateFormat
import java.time.LocalDateTime

/*
* Available Function:
 * 1. 파일 Directory명으로 PackageName 생성 및 선언
 * 2. Entity명은 DB 테이블 명
 * 3. KeyEntity명은 DB 테이블 명 + "_KEY", key Directory 아래에 생성
 * 4. Lombok 형태로 테이블 컬럼 표출
 * 5. Entity, KeyEntity에 컬럼 표출
 * 6. 복합키, 단일키 구분
*/

//컬럼 타입 매핑 설정
typeMapping = [
        (~/(?i)int|smallint|integer|bigint/)        : "Long",
        (~/(?i)float|double|decimal|real|numeric/)  : "Double",
        (~/(?i)datetime|timestamp|date|time/)       : "LocalDateTime",
        (~/(?i)/)                                   : "String"
]

//현재 일자
FORMATTEDDATE = new SimpleDateFormat("yyyy-MM-dd").format(new Date())

//테이블 키
primaryKey = [];

FILES.chooseDirectoryAndSave("Choose directory", "Choose where to store generated files") { dir ->
    SELECTION.filter { it instanceof DasTable }.each { generate(it, dir) }
}

def generate(table, dir) {
    //테이블이름
    def tableName = table.getName()
    //java 클래스이름
    def className = javaName(tableName, true)
    //필드명
    def fields = calcFields(table)

    //pk체크
    fields.each() {
        if(it.pk){
            primaryKey.push(it.name);
        }
    }

    //key 디렉토리
    def keyDir = ""

    //Entity생성
    new File(dir, tableName + ".java").withPrintWriter { out -> generate(out, tableName, className, fields, dir) }

    //key 디렉토리 생성
    keyDir = dir.toString() + "\\" +"key"
    mkDirectory(keyDir)
    
    if(primaryKey.size() > 1){
        //KeyEntity생성
        new File(keyDir, tableName + "_KEY.java").withPrintWriter { out -> generateKey(out, tableName, className, fields, keyDir) }
    }
}

//Entity 생성 설정
def generate(out, tableName, className, fields, dir) {
    //패키지명
    def packageName = setPackageNm(dir)

    out.println "package $packageName;"
    out.println ""
    out.println "import lombok.Getter;"
    out.println "import lombok.Setter;"
    out.println "import java.time.LocalDateTime;"
    out.println ""
    if(primaryKey.size() > 1){
        out.println "import ${packageName}.key.${tableName}_KEY;"
    }
    out.println ""
    if(primaryKey.size() > 1){
        out.println "import javax.persistence.EmbeddedId;"
    }else{
        out.println "import javax.persistence.Id;"
    }
    out.println "import javax.persistence.Column;"
    out.println "import javax.persistence.Entity;"
    out.println "import javax.persistence.Table;"
    out.println ""
    out.println "/**"
    out.println " * [] Entity<br />"
    out.println " *"
    out.println " * @author "
    out.println " * @since ${FORMATTEDDATE}<br />"
    out.println " * ------수정이력--------<br />"
    out.println " */"
    out.println ""
    out.println "@Getter"
    out.println "@Setter"
    out.println "@Entity"
    out.println "@Table(name = \"$tableName\")"
    out.println "public class $tableName {"
    if(primaryKey.size() > 1){
        //복합키인 경우
        out.println "    @EmbeddedId"
        out.println "    private ${tableName}_KEY key;"
        out.println ""
        fields.each() {
            if(!primaryKey.contains(it.name)){
                if (it.comment != "" && it.comment != null) {
                    out.println "    /* ${it.comment} */"
                }
                out.println "    @Column(name = \"${it.oriName}\")"
                out.println "    private ${it.type} ${it.name};"
                out.println ""
            }
        }
        out.println "}"
    }else{
        //단일키인 경우
        out.println ""
        fields.each() {
            if(primaryKey.contains(it.name)){
                if (it.comment != "" && it.comment != null) {
                    out.println "    /* ${it.comment} */"
                }
                out.println "    @Id"
                out.println "    @Column(name = \"${it.oriName}\")"
                out.println "    private ${it.type} ${it.name};"
                out.println ""
            }else{
                if (it.comment != "" && it.comment != null) {
                    out.println "    /* ${it.comment} */"
                }
                out.println "    @Column(name = \"${it.oriName}\")"
                out.println "    private ${it.type} ${it.name};"
                out.println ""
            }
        }
        out.println "}"
    }
}

//KeyEntity 생성 설정
def generateKey(out, tableName, className, fields, dir) {
    def packageName = setPackageNm(dir)

    out.println "package $packageName;"
    out.println ""
    out.println "import java.io.Serializable;"
    out.println "import java.time.LocalDateTime;"
    out.println ""
    out.println "import javax.persistence.Column;"
    out.println "import lombok.Getter;"
    out.println "import lombok.Setter;"
    out.println "import lombok.AllArgsConstructor;"
    out.println "import lombok.EqualsAndHashCode;"
    out.println "import lombok.NoArgsConstructor;"
    out.println ""
    out.println "/**"
    out.println " * [] Entity Key<br />"
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
    out.println "public class $tableName" + "_KEY implements Serializable {"
    out.println ""
    out.println "    private static final long serialVersionUID = 1L;"
    out.println ""
    fields.each() {
        if(primaryKey.contains(it.name)){
            if (it.comment != "" && it.comment != null) {
                out.println "    /* ${it.comment} */"
            }
            out.println "    @Column(name = \"${it.oriName}\")"
            out.println "    private ${it.type} ${it.name};"
            out.println ""
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

//클래스명 생성함수
def javaName(tableName, flag) {
    def s = tableName.tokenize("_")
    //클래스명 생성
    s.size() == 1 ? s[0].toLowerCase().capitalize() : s[s.size()-1].toLowerCase().capitalize()
}

//컬럼명 생성함수
def setColumnNm(columnName) {
    def s = columnName.tokenize("_")
    def name = ''
    for(int i=0; i<s.size(); i++) {
        if(i == 0){
            name = name + s[i].toLowerCase()
        }else {
            name = name + s[i].toLowerCase().capitalize()
        }
    }
    return name;
}

//필드명 생성함수
def calcFields(table) {
    DasUtil.getColumns(table).reduce([]) { fields, col ->
        def spec = Case.LOWER.apply(col.getDataType().getSpecification())
        def typeStr = typeMapping.find { p, t -> p.matcher(spec).find() }.value
        fields += [[
                           name : setColumnNm(col.getName()),
                           oriName : col.getName(),
                           type : typeStr,
                           comment : col.getComment(),
                           pk : DasUtil.isPrimary(col)
                   ]]
    }
}

//디렉토리를 생성하는 함수
def mkDirectory(dir) {
    File newFile = new File(dir);

    if(!newFile.exists()){
        newFile.mkdir();
    }
}