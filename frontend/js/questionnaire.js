import config from "./config/config.js";

//--- Initialize variables
const queryString = window.location.search;
const urlParam = new URLSearchParams(queryString);
const questionnaireID = urlParam.get('questionnaireID');
const session = urlParam.get('session');
const questionURL = `${config.api.base_url}/questionnaire/${questionnaireID}`;
const question = document.getElementById("question");
const resultButton = document.getElementById('result');
const skip = document.getElementById('skip');
let qdata;
let isSkipped;
const answer = new Map();
const optiontext = new Map();

//--- Add loader
const loader = document.querySelector(".loader");
const loaded = document.querySelector("#loaded");

//--- Get all the data we need from API
getquestions(questionURL);

async function getquestions(url) {
    const res = await fetch(url);
    const data = await res.json();
    qdata = data;
    getoptions();
}
async function getoptions() {
    for (let index = 0; index < qdata.questions.length; index++) {
        const res = await fetch(`${config.api.base_url}/question/${questionnaireID}/${qdata.questions[index].qID}`);
        const data = await res.json();
        qdata.questions[index].options = data.options;
    }
    loader.style.display = "none"
    loaded.style.display = "flex"
    init()
}

//--- Init function
function init() {
    let currentqID = qdata.questions[0].qID;
    let currentOID = null;
    let selected = null;
    let nextqID = null;
    const qmap = new Map();
    for (let index = 0; index < qdata.questions.length; index++) {
        qmap.set(`${qdata.questions[index].qID}`, index);
    }

    //--- Buttons Configuration
    const clr = document.getElementById('clr');
    clr.addEventListener('click', () => {
        document.getElementById('sbt').setAttribute("disabled", "disabled");
    });

    //--- Event listener for sumbiting
    const myform = document.getElementById('myform');
    myform.addEventListener('submit', function(e) {
        e.preventDefault();
        skip.style.display = "none";
        let id = qmap.get(currentqID);
        answer.set(currentqID, currentOID);
        for (let index = 0; index < qdata.questions[id].options.length; index++) {
            if (qdata.questions[id].options[index].opttxt == '<open string>' && !optiontext.has(selected)) {
                optiontext.set(currentOID, selected);
            }
        }
        if (nextqID == 'null') {
            showResults();
        } else {
            iterate(nextqID);
        }
    });

    //--- Shows results
    function showResults() {
        const resultdiv = document.getElementById('questionnaire');
        resultdiv.style.marginTop = "10%"
        resultdiv.innerHTML = `<table style="font-size: medium;" class="table" id="results"></ul>`
        const mylist = document.getElementById('results');
        const iter = answer.entries();
        let ivalue = iter.next();
        while (!ivalue.done) {
            const id = qmap.get(ivalue.value[0]);
            let text = qdata.questions[id].qtext;
            for (let i = 0; i < qdata.questions.length; i++) {
                text = text.replace("[*" + qdata.questions[i].qID + "]", "\"" + qdata.questions[i].qtext + "\"");

                for (let j = 0; j < qdata.questions[i].options.length; j++) {
                    const optID = qdata.questions[i].options[j].optID;
                    let opttxt = qdata.questions[i].options[j].opttxt;

                    if (opttxt == "<open string>") opttxt = optiontext.get(optID);

                    text = text.replace("[*" + optID + "]", "\"" + opttxt + "\"");
                }
            }

            const otext = optiontext.get(ivalue.value[1]);
            mylist.innerHTML += `
            <tr>
                <th scope="col">${text}</th>
                <td style="width: 50%;"  scope="col">${otext}</td>
            </tr>`
            ivalue = iter.next();
        }
        resultButton.style.marginTop = "10%";
        resultButton.style.display = "flex";
        resultButton.addEventListener('click', e => {
            e.preventDefault();
            const iterator = answer.entries();
            let results = iterator.next();
            while (!results.done) {
                const sessionURL = `${config.api.base_url}/doanswer/${questionnaireID}/${results.value[0]}/${session}/${results.value[1]}`
                fetch(sessionURL, { method: 'POST' })
                    .then(res => res.json())
                    .then(results = iterator.next())
            }

            alert("Thanks for answering!")
            setTimeout(function() { window.location.href = ".."; }, 1000);
        })
    }

    //--- Gets answers
    function getAnswer(qid) {
        currentqID = qid;
        let selectedOptions = null;
        selectedOptions = document.getElementsByName('questionID');
        for (var radio of selectedOptions) {
            if (radio.type == 'text') {
                radio.addEventListener('keyup', () => {
                    const txt = document.getElementsByName('questionID').value;
                    if (txt != "") {
                        document.getElementById('sbt').removeAttribute("disabled");
                    } else {
                        document.getElementById('sbt').setAttribute("disabled", "disabled");
                    }
                })
            }
            radio.addEventListener('input', function(event) {
                event.preventDefault();
                selected = event.target.value;
                if (event.target.type != 'text') {
                    optiontext.set(selected, event.target.getAttribute("opttxt"));
                    currentOID = selected;
                } else {
                    currentOID = event.target.getAttribute("optid");
                }
                document.getElementById('sbt').removeAttribute("disabled");
                nextqID = event.target.getAttribute("nextqid");
            })
        }
    }

    //--- Render questions
    function iterate(qid) {
        let id = qmap.get(qid);
        document.getElementById('sbt').setAttribute("disabled", "disabled");

        let rendered_text = qdata.questions[id].qtext;
        for (let i = 0; i < qdata.questions.length; i++) {
            rendered_text = rendered_text.replace("[*" + qdata.questions[i].qID + "]", "\"" + qdata.questions[i].qtext + "\"");

            for (let j = 0; j < qdata.questions[i].options.length; j++) {
                const optID = qdata.questions[i].options[j].optID;
                let opttxt = qdata.questions[i].options[j].opttxt;

                if (opttxt == "<open string>") opttxt = optiontext.get(optID);

                rendered_text = rendered_text.replace("[*" + optID + "]", "\"" + opttxt + "\"");
            }
        }

        question.innerText = rendered_text;
        const showoptions = document.getElementById("option-container");
        showoptions.innerHTML = "";
        for (let index = 0; index < qdata.questions[id].options.length; index++) {
            if (qdata.questions[id].options[index].opttxt == '<open string>') {
                showoptions.innerHTML += `
                    <input type="text" optid="${qdata.questions[id].options[index].optID}" nextqid="${qdata.questions[id].options[0].nextqID}" name="questionID">
                    `
            } else {
                showoptions.innerHTML += `
                <input type="radio" opttxt="${qdata.questions[id].options[index].opttxt}" nextqid="${qdata.questions[id].options[index].nextqID}" id="${index}" name="questionID" value="${qdata.questions[id].options[index].optID}">
                <label for="${index}">${qdata.questions[id].options[index].opttxt}</label><br>
                `
            }
        }
        if (qdata.questions[id].required == 'FALSE') {
            skip.style.display = "flex";
            skip.addEventListener('click', event => {
                event.preventDefault();
                for (let index = 0; index < qdata.questions[id].options.length; index++) {
                    if (qdata.questions[id].options[index].nextqID == null) {
                        showResults();
                    } else {
                        isSkipped = true;
                        skip.style.display = "none";
                        iterate(qdata.questions[id + 1].qID);
                    }
                }
            });
        }
        getAnswer(qid);

    }

    //--- Start
    iterate(currentqID);
}