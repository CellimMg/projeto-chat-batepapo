const URL = "https://mock-api.driven.com.br/api/v6/uol";

const RECURSO_PARTICIPANTES = `${URL}/participants`;
const RECURSO_STATUS = `${URL}/status`;
const RECURSO_MENSAGENS = `${URL}/messages`;

const currentUser = {
    nome: null
};

let visibilidadeDeEnvio = "message"; //message = publica e private_message = privada
let usuario = "Todos";

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
/*
   Usuarios é uma lista de objetos
   os objetos devem ter os campos
    name: "João"
*/
let usuarios = [];



setup();

function changeScreen() { }

function setup() {
    const nome = prompt("nome");
    login(nome);
}

//FUNCOES REFERENTES À TROCA DE MENSAGENS
function getMensagens() {
    const promise = axios.get(RECURSO_MENSAGENS);
    promise.then((response) => {
        //resetando a div das mensagens
        limparDivPrincipal();
        //array temporario so pra comparar com o array ja construido
        const mensagensTemp = response.data.map(construtorMensagem);
        //verifica se deve rolar, de acordo com as mensagens novas e as antigas
        const deveRolar = compararObjetos(mensagensTemp.slice(-1), mensagens.slice(-1)) == false || mensagens.length == 0;
        mensagens = mensagensTemp;
        //renderiza as imagens na tela
        mensagens.map(construirMensagem);
        if (deveRolar) {
            scrollarParaUltimaMensagem();
        }
    });
    promise.catch(handleError);
}

function sendMensagem(mensagemTexto, destinatario = "Todos", tipo = "message") {
    const corpoReq = {
        from: currentUser.nome,
        to: destinatario,
        text: mensagemTexto,
        type: tipo
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
        sincronizarUsuarios();
        manterAtualizado();
    });
    promise.catch((_error) => {
        setup();
    });
}

//faz o setup das atualizacoes de mensagens e usuarios conectados
function manterAtualizado() {
    setInterval(getMensagens, 3000);
    setInterval(() => manterConexao(currentUser.nome), 5000);
    setInterval(sincronizarUsuarios, 10000);
}


function sincronizarUsuarios() {
    const promise = axios.get(RECURSO_PARTICIPANTES);
    promise.then((response) => {
        limparDivUsuarios();
        usuarios = response.data.map(construtorUsuario);
        usuarios.map(construirUsuarios);
    });
    promise.catch(handleError);
}

function manterConexao(nome) {
    const corpoReq = {
        name: nome
    };
    const promise = axios.post(RECURSO_STATUS, corpoReq);
    promise.catch(handleError);
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

function construtorUsuario(usuario) {
    const usuarioObj = {
        nome: usuario.name
    }
    return usuarioObj;
}

//Transforma 2 objetos em String e compara
//Para a comparação funcionar, deve-se possuir os atributos em mesma ordem
//retorna true para objetos iguais
function compararObjetos(objeto1, objeto2) {
    if (JSON.stringify(objeto1) == JSON.stringify(objeto2)) {
        return true;
    }
    return false;
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

function construirUsuarios(usuario) {
    switch (usuario.nome) {
        case currentUser.nome:
            break;
        default:
            inserirUsuario(usuario);
            break;
    }
}

function inserirUsuario(usuario) {
    const divUsuarios = document.querySelector(".usuario-container");
    const divUsuario = `<div onclick="onTapUsuario(this)" class="usuario"><img src="./assets/images/perfis.svg"
                        alt="Ícone de Mensagem para todos"><span>${usuario.nome}</span><img
                        src="./assets/images/check.svg" alt="Icone de seleçao">
                </div>`;
    divUsuarios.innerHTML += divUsuario;
}

function limparDivPrincipal() {
    const divMain = document.querySelector("main");
    divMain.innerHTML = "";
}

function limparDivUsuarios() {
    const divUsuarios = document.querySelector(".usuario-container");
    divUsuarios.innerHTML = `<div>Escolha um contato para enviar mensagens:</div>
                <div onclick="onTapUsuario(this)" class="usuario"><img src="./assets/images/perfis.svg"
                        alt="Ícone de Mensagem para todos"><span>Todos</span><img style="visibility: visible"
                        src="./assets/images/check.svg" alt="Icone de seleçao">
                </div>`;
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

//FUNCOES DE MANIPULAÇAO VISUAL
function closeMenuLateral() {
    const bodyNav = document.querySelector(".body-nav");
    bodyNav.style.visibility = "hidden";
    bodyNav.style.backgroundColor = "#00000000";
    const sideNav = bodyNav.querySelector(".side-right-nav");
    sideNav.style.right = "-70%";
}

function openMenuLateral() {
    const bodyNav = document.querySelector(".body-nav");
    bodyNav.style.visibility = "visible";
    bodyNav.style.backgroundColor = "#00000099";
    const sideNav = bodyNav.querySelector(".side-right-nav");
    sideNav.style.right = "0";
}

function onTapVisibilidade(divVisibilidade) {
    const divs = document.querySelectorAll(".visibilidade img:last-child");
    divs.forEach(value => {
        value.style.visibility = "hidden";
    });
    divVisibilidade.querySelector("img:last-child").style.visibility = "visible";
    visibilidadeDeEnvio = divVisibilidade.querySelector(".visibilidade span").innerText;
}

function onTapUsuario(divUsuario) {
    const divs = document.querySelectorAll(".usuario img:last-child");
    divs.forEach(value => {
        value.style.visibility = "hidden"
    });
    divUsuario.querySelector("img:last-child").style.visibility = "visible";
    usuario = divUsuario.querySelector(".usuario span").innerText;
}
