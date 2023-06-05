import com.intellij.database.model.DasTable
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import javax.swing.*

/*
* Available Function:
* 1. 파일 Directory명으로 PackageName 생성 및 선언
* 2. Entity명은 DB 테이블 명
* 3. Lombok 형태로 테이블 컬럼 표출
*/

//컬럼 타입 매핑 설정
typeMapping = [
        (~/(?i)int/)                      : "long",
        (~/(?i)float|double|decimal|real/): "double",
        (~/(?i)datetime|timestamp/)       : "Timestamp",
        (~/(?i)date/)                     : "Date",
        (~/(?i)time/)                     : "Time",
        (~/(?i)/)                         : "String"
]

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

    new File(dir, tableName + ".java").withPrintWriter { out -> generate(out, tableName, className, fields, dir) }
}

//Entity 생성 설정
def generate(out, tableName, className, fields, dir) {
    def packageName = setPackageNm(dir, className)

    out.println "package $packageName;"
    out.println ""
    out.println "import lombok.*;"
    out.println "import java.io.Serializable;"
    out.println ""
    out.println "import javax.persistence.*;"
    out.println "import java.util.*;"
    out.println ""
    out.println "/**"
    out.println " * @Description : "
    out.println " * @Modification Information"
    out.println " *                  수정일     수정자               수정내용"
    out.println " *               ---------- --------- -------------------------------"
    out.println " *"
    out.println " *"
    out.println " * @author"
    out.println " * @version 1.0.0"
    out.println " * @since"
    out.println " */"
    out.println "@Setter"
    out.println "@Getter"
    out.println "@Entity"
    out.println "@Table(name = \"$tableName\")"
    out.println "public class $tableName" + " implements Serializable {"
    out.println "    private static final long serialVersionUID = 1L;"
    out.println ""
    fields.each() {
        if (it.comment != "") {
            out.println "    /*${it.comment}*/"
        }
        out.println "    @Column(name = \"${it.oriName}\")"
        out.println "    private ${it.type} ${it.name};"
        out.println ""
    }
    out.println "}"
}

//패키지 이름생성 생성함수
def setPackageNm(dir, className) {
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
        name = name + s[i].toLowerCase().capitalize()
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
                       comment : col.getComment()
                   ]]
    }
}