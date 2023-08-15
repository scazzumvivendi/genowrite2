var Size = Quill.import('attributors/style/size');
Quill.register(Size, true);

var quill = new Quill('#editor', {
    theme: 'snow'
},);

const editor = document.getElementById('editor');

function resizeEditor() {
  const windowHeight = window.innerHeight;
  const editorHeight = editor.offsetHeight;

  if (editorHeight > windowHeight - 175) {
    editor.style.height = (windowHeight - 175) + 'px';
  }
}

// Chiamare la funzione all'avvio e in caso di ridimensionamento della finestra
resizeEditor();
window.addEventListener('resize', resizeEditor);


/** Utils */
function checkWordCount(text) {
    if (!text || text=="\n") {
        return;
    }
    this.wordCount = text.match(/\w+/g) ? text.match(/\w+/g).length : 0;
    this.characterCount = text.length;
    document.querySelector("#word-count-span").innerHTML = this.wordCount
    document.querySelector("#character-count-span").innerHTML = this.characterCount
}

function checkLineEndsWithStopOrSimilar(allText) {
    quill.formatText(0, allText.length, 'background', 'transparent');   
    let lines = allText.split("\n")
    let charCount = 0
    for (let line of lines) {
        if (line == "") { charCount += line.length + 1; continue }
        if (!["?", "!", ".", "…"].includes(line[line.length - 1])){
            quill.formatText(charCount + line.length - 1, 1, 'background', '#CD1818');
        }
        charCount += line.length + 1
    }
}

function checkIfStopOrSimilarIsPrecededBySpace(allText) {
    for (let j in allText) {
        i=parseInt(j)
        if (["?", "!", ".", "…"].includes(allText[i]) && allText[i-1] == " "){
            quill.formatText(i - 1, 1, 'background', '#CD1818');
        }
    }
}

function checkLineStartsWithNoSpace(allText) {
    let lines = allText.split("\n")
    let charCount = 0
    for (let line of lines) {
        if (line == "") { charCount += line.length + 1; continue }
        if (line.charCodeAt(0)  == 160){
            quill.formatText(charCount, 1, 'background', '#CD1818');   
        }
        charCount += line.length + 1
    }
}

function replaceTokens(allText) {
    for (token in tokenToCorrect) {
        while (allText.indexOf(token) != -1) {
            tokenIndex = allText.indexOf(token)
            quill.deleteText(tokenIndex, token.length);
            quill.insertText(tokenIndex, tokenToCorrect[token])
            allText = quill.getText(0)
        }
    }
}

const tokenToCorrect =  {
    '...': '…',
    '\'': '’',
    '--': '–',
    'E\'': 'È'
}

function checkPeriodStartWithCapital(allText) {
    let lines = allText.split("\n")
    let charCount = 0
    for (let line of lines) {
        if (line == "") { charCount += line.length + 1; continue }
        text = quill.getText(charCount, 1)
        if (periodStartExceptions.includes(text)) {
            realText = quill.getText(charCount + 2, 1)
            if (realText != "" && realText != "\n" && realText != realText.toUpperCase()) {
                quill.deleteText(charCount + 2, 1);
                quill.insertText(charCount + 2, realText.toUpperCase())
            }           

        } else {
            if (text != "" && text != "\n" && text != text.toUpperCase()) {
                quill.deleteText(charCount, 1);
                quill.insertText(charCount, text.toUpperCase())
            }  
            
        }

        secondaryCharCount = 0
        let sentences = line.split(/\.|\?|\!/)
        for (let sentence of sentences) {
            if (sentence == "") { secondaryCharCount += sentence.length + 1; continue }
            
            secondaryText = quill.getText(charCount + secondaryCharCount + 1, 1)
            prevSecondaryText = quill.getText(charCount + secondaryCharCount, 1)
            if (secondaryText != "" && secondaryText != "\n" && secondaryText != secondaryText.toUpperCase()
                && secondaryCharCount + sentence.length <= line.length
                && secondaryCharCount != 0
            ) {
                if (prevSecondaryText == " ") {
                    quill.deleteText(charCount + secondaryCharCount + 1, 1);
                    quill.insertText(charCount + secondaryCharCount + 1, secondaryText.toUpperCase())
                } else {
                    quill.formatText(charCount + secondaryCharCount, 1, 'background', '#CD1818');   
                }
               
            }

            secondaryCharCount += sentence.length + 1
        }
        
        charCount += line.length + 1
    }
}

const periodStartExceptions = ["–"]

function checkNoDoubleSpaces(allText) {
    for (let j in allText) {
        i=parseInt(j)
        if (allText[i] == " " && allText[i + 1] == " ") {
            quill.formatText(i + 1, 1, 'background', '#FFD369');   
        }
    }
}

function checkNoTwoCapitalConsecutiveLetters(allText) {
    for (let j in allText) {
        i=parseInt(j)
        if (allText[i].toLowerCase() != allText[i].toUpperCase() &&
            allText[i + 1].toLowerCase() != allText[i + 1].toUpperCase() &&
            allText[i + 2].toLowerCase() != allText[i + 2].toUpperCase() &&
            allText[i] == allText[i].toUpperCase() &&
            allText[i + 1] == allText[i + 1].toUpperCase() &&
            allText[i + 2] != allText[i + 2].toUpperCase()) {
            quill.formatText(i + 1, 1, 'background', '#FFD369');   
        }
    }
}

/** End utils */

var timeout = null;
var dropboxTimeout = null;
var genowriteContent, genowriteKeys;
if (accessToken) {
    setTimeout(
        ()=>syncGenowriteState(), 5
    )
} else if (localStorage.getItem('genowrite-content')) {
    genowriteContent = JSON.parse(localStorage.getItem('genowrite-content'))
    genowriteKeys = Object.keys(genowriteContent)
    selectDocument(genowriteKeys[0])
    refreshDocumentList(genowriteKeys)
    allChecks()
}

var selectedDoc;

function selectDocument(text) {
    selectedDoc = text;
    genowriteContent = JSON.parse(localStorage.getItem('genowrite-content'))
    quill.setContents(genowriteContent[selectedDoc])
    var modal = document.getElementById("menu-modal");
    modal.style.display = "none";
}

quill.on('text-change', function (delta, oldDelta, source) {
    if (source == "user") {

        if (timeout) {
            clearTimeout(timeout)
            timeout = null
        }
        timeout = setTimeout(() => {
            allChecks()
            if (!genowriteContent) {
                genowriteContent = {}
            }
            genowriteContent[selectedDoc] = quill.getContents()
            localStorage.setItem('genowrite-content', JSON.stringify(genowriteContent))
            timeout = null;
        }, 150, selectedDoc)
        
        if (dropboxTimeout) {
            clearTimeout(dropboxTimeout)
            dropboxTimeout = null
        }
        dropboxTimeout = setTimeout(
            () => uploadGenowriteState(JSON.stringify(genowriteContent)), 500
        )

        var range = quill.getSelection();
        if (range && range.length == 0) {
            quill.formatText(range.index - 2, 2, 'background', 'transparent');
        }
          
    }
});

function allChecks() {
    const allText = quill.getText(0)

    checkWordCount(allText)
    checkLineEndsWithStopOrSimilar(allText)
    checkLineStartsWithNoSpace(allText)
    checkIfStopOrSimilarIsPrecededBySpace(allText)
    checkPeriodStartWithCapital(allText)
    checkNoDoubleSpaces(allText)
    checkNoTwoCapitalConsecutiveLetters(allText)
    replaceTokens(allText)
}

function addDocument() {
    const name = document.querySelector("#newDocumentName").value
    genowriteContent = JSON.parse(localStorage.getItem('genowrite-content'))
    if (!genowriteContent) {
        genowriteContent = {}
    }
    genowriteContent[name] = {}
    genowriteKeys = Object.keys(genowriteContent)
    localStorage.setItem('genowrite-content', JSON.stringify(genowriteContent))
    refreshDocumentList(genowriteKeys)
    document.querySelector("#newDocumentName").value = null
}

function refreshDocumentList(genowriteKeys) {
    docsContainer = document.querySelector("#docs");
    docsContainer.innerHTML = '';
    for (let key of genowriteKeys) {
        const fileTitle = document.createElement("p")
        fileTitle.classList = "doc"
        fileTitle.attributes["name"] = key
        const textNode = document.createTextNode(key);
        fileTitle.addEventListener('click', (ev)=>selectDocument(key))
        fileTitle.append(textNode)
        const deleteButton = document.createElement("button")
        deleteButton.style.float = "right"
        deleteButton.innerText = "cancella"
        deleteButton.addEventListener('click', (ev)=>deleteDocument(key))
        fileTitle.append(deleteButton)
        docsContainer.appendChild(fileTitle)
    }
}

function uploadGenowriteState(state) {
    setGenowriteDropboxState(state);
}

function syncGenowriteState() {
    for (let i = 4; i--; i >= 0){
        let oldContent = localStorage.getItem('genowrite-content-'+i)
        if (oldContent) {
            localStorage.setItem('genowrite-content-'+(i+1), oldContent)
        }
    }
    localStorage.setItem('genowrite-content-0', localStorage.getItem('genowrite-content'))
    if (getGenowriteDropboxState) {
        getGenowriteDropboxState().then((newState) => {
            if (!newState) {
                genowriteContent = JSON.parse(localStorage.getItem('genowrite-content'))
            } else {
                localStorage.setItem('genowrite-content', newState)
                genowriteContent = JSON.parse(newState);
            }
            genowriteKeys = Object.keys(genowriteContent)
            selectDocument(genowriteKeys[0])
            refreshDocumentList(genowriteKeys)
            allChecks()
            document.querySelector("#dropbox-auth").style.display = "none";
            document.querySelector("#dropbox-synced").style.display = "block";
        })
    } else {
        setTimeout(()=>syncGenowriteState(), 100)
    }
    
}

function deleteDocument(name) {
    genowriteContent = JSON.parse(localStorage.getItem('genowrite-content'))
    delete genowriteContent[name]
    genowriteKeys = Object.keys(genowriteContent)
    localStorage.setItem('genowrite-content', JSON.stringify(genowriteContent))
    refreshDocumentList(genowriteKeys)
}