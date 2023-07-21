import com.intellij.database.model.DasTable
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import javax.swing.*

/*
* Available Function:
* 1. 파일 Directory명으로 PackageName 생성 및 선언
* 2. 파일명은 입력한 파일명
* 3. DB테이블의 모든 컬럼 DTO 생성
* 4. String의 경우 @Size 어노테이션 추가
* 5. NotNull 체크 되어 있는경우 @NotNull 어노테이션추가
*/

def input(InputText) {
    JFrame jframe = new JFrame()
    def answer = JOptionPane.showInputDialog(InputText)
    jframe.dispose()
    return answer
}

fileNm = input("파일명을 입력하세요.")

if (fileNm != null && fileNm != "") {
    FILES.chooseDirectoryAndSave("Choose directory", "Choose where to store generated files") { dir ->
        SELECTION.filter { it instanceof DasTable }.each { generate(it, dir) }
    }
}

def generate(table, dir) {
    //테이블이름
    def tableName = table.getName()

    //필드명
    def fields = calcFields(table)

    //Entity생성
    new File(dir, fileNm + ".java").withPrintWriter { out -> generate(out, tableName, fields, dir) }
}

//DTO 생성 설정
def generate(out, tableName, fields, dir) {
    //패키지명
    def packageName = setPackageNm(dir, fileNm)

    out.println "package $packageName;"
    out.println ""
    out.println "import lombok.*;"
    out.println "import javax.validation.*;"
    out.println "import io.swagger.annotations.ApiModel;"
    out.println "import io.swagger.annotations.ApiModelProperty;"
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
    out.println "@Getter"
    out.println "@Setter"
    out.println "@ApiModel(value = \"${fileNm} - \")"
    out.println "public class ${fileNm}" + " {"
    fields.each() {
        if (it.comment != "" && it.comment != null) {
            out.println "    @ApiModelProperty(value = \"${it.comment} / ${it.oriType}\", example = \"\")"
        }
        if (it.isNotNull){
            out.println "    @NotNull"
        }
        if (it.size != "" && it.size != null){
            out.println "    ${it.size}"
        }
        out.println "    private ${it.type} ${it.name};"
        out.println ""
    }
    out.println "}"
}

//패키지 이름생성 생성함수
def setPackageNm(dir, fileNm) {
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
        }else {
            name = name + s[i].toLowerCase().capitalize()
        }
    }
    return name;
}

//필드명 생성함수
def calcFields(table) {
    DasUtil.getColumns(table).reduce([]) { fields, col ->
        def oriType = col.getDataType().toString()
        def typeStr = setType(oriType)
        def size = setSize(oriType)
        fields += [[
                           name : setColumnNm(col.getName()),
                           oriName : col.getName(),
                           oriType : oriType,
                           type : typeStr,
                           size : size,
                           comment : col.getComment(),
                           isNotNull : col.isNotNull()
                   ]]
    }
}

//필드 Type 설정 함수
def setType(oriType) {
    int s = oriType.indexOf("(")
    def type = "CHAR, VARCHAR2, NCHAR, NVARCHAR"
    def type2 = "NUMBER, FLOAT"
    def typeStr = ""

    if(s !== -1){
        def typeNm = oriType.substring(0, s-1)
        
        if(type.contains(typeNm)){
            //문자열
            typeStr = "String"
            return typeStr
        }else if(type2.contains(typeNm)){
            //숫자
            typeStr = "Double"
            return typeStr
        }
    }else{
        //날짜
        typeStr = "String"
        return typeStr
    }
}

//필드 MinMax 설정 함수
def setSize(oriType) {
    int s = oriType.indexOf("(")
    def type = "CHAR, VARCHAR2, NCHAR, NVARCHAR"
    def type2 = "NUMBER, FLOAT"
    def size = ""

    if(s !== -1){
        def typeNm = oriType.substring(0, s-1)

        if(type.contains(typeNm)){
            //문자열
            def maxSize = oriType.substring(s+1, oriType.length()-1)

            size = "@Size(max = ${maxSize})"

            return size
        }
    }
}