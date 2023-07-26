var Size = Quill.import('attributors/style/size');
Quill.register(Size, true);

var quill = new Quill('#editor', {
    theme: 'snow'
},);

if (localStorage.getItem('delta')) {
    quill.setContents(JSON.parse(localStorage.getItem('delta')))    
}


/** Utils */
function checkWordCount(text) {
    if (!text) {
        return;
    }
    this.wordCount = text.match(/\w+/g).length;
    this.characterCount = text.length;
    console.log(this.wordCount, this.characterCount)
    document.querySelector("#word-count-span").innerHTML = this.wordCount
    document.querySelector("#character-count-span").innerHTML = this.characterCount
}

function checkLineEndsWithStopOrSimilar(allText) {
    quill.formatText(0, allText.length, 'background', 'transparent');   
    let lines = allText.split("\n")
    let charCount = 0
    for (let line of lines) {
        if (line == ""){continue}
        if (!["?", "!", "."].includes(line[line.length - 1])){
            quill.formatText(charCount + line.length - 1, 1, 'background', '#ffcccb');   
        }
        charCount += line.length + 1
    }
}

/** End utils */

quill.on('text-change', function (delta, oldDelta, source) {
    if (source == "user") {
        const allText = quill.getText(0)
        checkWordCount(allText)
        checkLineEndsWithStopOrSimilar(allText)
        localStorage.setItem('delta', JSON.stringify(quill.getContents()))
    }
});

