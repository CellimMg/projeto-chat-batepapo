const URL = "https://mock-api.driven.com.br/api/v6/uol";

const RECURSO_PARTICIPANTES = `${URL}/participants`;
const RECURSO_STATUS = `${URL}/status`;
const RECURSO_MENSAGENS = `${URL}/messages`;

const currentUser = {
    nome: null
};

/*
    Mensagens é uma lista de objetos
    os objetos devem ter os campos
        from: "João",
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: "08:01:17"        
*/
let mensagens = [];

login("Marcelo");

function changeScreen() { }

function setup() { }

//FUNCOES REFERENTES À TROCA DE MENSAGENS
function getMensagens() {
    const promise = axios.get(RECURSO_MENSAGENS);
    promise.then((response) => {
        //resetando a div das mensagens
        limparDivPrincipal();
        //populando o array
        mensagens = response.data.map(construtorMensagem);
        //inserindo as mensagens na tela
        mensagens.map(construirMensagem);
        //scrollando para o ultimo elemento
        scrollarParaUltimaMensagem();
    });
    promise.catch(handleError);
}

function sendMensagem(mensagemTexto) {
    const corpoReq = {
        from: currentUser.nome,
        to: "Todos",
        text: mensagemTexto,
        type: "message"
    };

    if (mensagemTexto != "") {
        const promise = axios.post(RECURSO_MENSAGENS, corpoReq);
        promise.then((_response) => {
            limparFormulario();
            getMensagens();
        });
        promise.catch(handleError);
    }
}

//FUNCOES REFERENTES À AUTENTICACAO
function login(nome) {
    const corpoReq = {
        name: nome
    };
    const promise = axios.post(RECURSO_PARTICIPANTES, corpoReq);
    promise.then((_response) => {
        currentUser.nome = nome;
        getMensagens();
        manterConexao(nome);
        manterChatAtualizado();
    });
    promise.catch(handleError);
}


function manterChatAtualizado() {
    setInterval(() => getMensagens(), 3000);
}

function manterConexao(nome) {
    const corpoReq = {
        name: nome
    };
    setInterval(() => {
        const promise = axios.post(RECURSO_STATUS, corpoReq);
        promise.catch(handleError);
    }, 5000);
}

//FUNCOES UTILITÁRIAS
function handleError(error) {
    console.log(error.response);
}

function construtorMensagem(mensagem) {
    const mensagemObj = {
        from: mensagem.from,
        to: mensagem.to,
        text: mensagem.text,
        type: mensagem.type,
        time: mensagem.time
    };
    return mensagemObj;
}

//FUNCOES DE CONSTRUCAO VISUAL
function construirMensagem(mensagem) {
    switch (mensagem.type) {
        case "status":
            inserirMensagemStatus(mensagem);
            break;
        case "message":
            inserirMensagemTexto(mensagem);
            break;
        default:
            break;
    }
}

function limparDivPrincipal() {
    const divMain = document.querySelector("main");
    divMain.innerHTML = "";
}

function inserirMensagemStatus(mensagem) {
    const divMain = document.querySelector("main");
    const divMensagemStatus = `<div class="mensagem status">
            <p><span class="horario">(${mensagem.time})</span> <span class="pessoa">${mensagem.from}</span> ${mensagem.text}</p>
        </div>`;
    divMain.innerHTML += divMensagemStatus;
}

function inserirMensagemTexto(mensagem) {
    const divMain = document.querySelector("main");
    let divMensagemTexto;

    if (mensagem.to == currentUser.nome || mensagem.to == "Todos") {
        if (mensagem.to == "Todos") { //é privada
            divMensagemTexto = `<div class="mensagem">
            <p><span class="horario">(${mensagem.time})</span> <span class="pessoa">${mensagem.from}</span> para <span class="pessoa">${mensagem.to}:</span> ${mensagem.text}</p>
        </div>`;
        } else {
            divMensagemTexto = `<div class="mensagem reservada">
            <p><span class="horario">(${mensagem.time})</span> <span class="pessoa">${mensagem.from}</span> reservadamente para <span class="pessoa">${mensagem.to}:</span> ${mensagem.text}</p>
        </div>`;
        }
        divMain.innerHTML += divMensagemTexto;
    }

}

function scrollarParaUltimaMensagem() {
    const ultimaMensagem = document.querySelector("main .mensagem:last-child");
    ultimaMensagem.scrollIntoView();
}

function limparFormulario() {
    document.querySelector("form").reset();
}