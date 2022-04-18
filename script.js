const URL = "https://mock-api.driven.com.br/api/v6/uol";

const RECURSO_PARTICIPANTES = `${URL}/participants`;
const RECURSO_STATUS = `${URL}/status`;
const RECURSO_MENSAGENS = `${URL}/messages`;

let intervalStatus, intervalMessages, intervalParticipants;

const currentUser = {
    nome: null
};

let visibilidadeDeEnvio = "Público"; //message = Público e private_message = Reservado
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



function changeToLogin() {
    document.querySelector("body").innerHTML = `<form class="login" action="javascript:login(nome.value)">
        <img src="./assets/images/logo.svg" alt="Logo da aplicação escrito Bate-Papo Uol" height="92px" width="130px">
        <input type="text" name="nome" id="nome" placeholder="Digite seu nome">
        <button type="submit">Entrar</button>
    </form>`;
}


function changeToChat() {
    document.querySelector("body").innerHTML = `<div class="body-nav">
        <div class="side-left-nav" onclick="closeMenuLateral()"></div>
        <div class="side-right-nav">
            <div class="visibilidade-container">
                <div>Escolha a visibilidade da mensagem:</div>
                <div onclick="onTapVisibilidade(this)" class="visibilidade"><img
                        src="./assets/images/public-message.svg"
                        alt="Ícone de mensagem publica"><span>Público</span><img style="visibility: visible"
                        src="./assets/images/check.svg" alt="Icone de seleçao"></div>
                <div onclick="onTapVisibilidade(this)" class="visibilidade"><img
                        src="./assets/images/private-message.svg"
                        alt="Ícone de mensagem reservada"><span>Reservadamente</span><img
                        src="./assets/images/check.svg" alt="Icone de seleçao"></div>
            </div>
            <div class="usuario-container">
                <div>Escolha um contato para enviar mensagens:</div>
                <div onclick="onTapUsuario(this)" class="usuario"><img src="./assets/images/perfis.svg"
                        alt="Ícone de Mensagem para todos"><span>Todos</span><img style="visibility: visible"
                        src="./assets/images/check.svg" alt="Icone de seleçao">
                </div>
            </div>
        </div>
    </div>

    <header>
        <img src="./assets/images/logo.svg" alt="Logo da aplicação escrito Bate-Papo Uol" height="53px" width="">
        <button onclick="openMenuLateral()"><img src="./assets/images/icon-perfil.svg" alt="Ícone do Menu" height="31px"
                width="42px"></button>
    </header>

    <main>
        
    </main>

    <footer>
        <form action="javascript:sendMensagem(mensagem.value)">
            <input type="text" name="mensagem" id="mensagem" placeholder="Escreva aqui...">
            <button type="submit"><img src="./assets/images/icon-enviar-mensagem.svg" alt="Botão de envio da mensagem"
                    height="26px" width="26px"></button>
        </form>
    </footer>`;
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

function sendMensagem(mensagemTexto) {
    const corpoReq = {
        from: currentUser.nome,
        to: usuario,
        text: mensagemTexto,
        type: visibilidadeDeEnvio == "Público" ? "message" : "private_message"
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
        changeToChat();
        currentUser.nome = nome;
        getMensagens();
        sincronizarUsuarios();
        manterAtualizado();
    });
    promise.catch((_error) => {
        alert("Este nome de usuário não está disponível, tente novamente em alguns instantes ou escolha outro nome de usuário!");
    });
}

//faz o setup das atualizacoes de mensagens e usuarios conectados
function manterAtualizado() {
    intervalMessages = setInterval(getMensagens, 3000);
    intervalStatus = setInterval(() => manterConexao(currentUser.nome), 5000);
    intervalParticipants = setInterval(sincronizarUsuarios, 10000);
}


function sincronizarUsuarios() {
    const promise = axios.get(RECURSO_PARTICIPANTES);
    promise.then((response) => {

        usuarios = response.data.map(construtorUsuario);
        if (!usuarios.some(e => e.nome === usuario)) {
            usuario = 'Todos';
        }
        limparDivUsuarios(usuarios);
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
function handleError(_error) {
    confirm("Algo deu errado, por favor, faça seu login novamente!");
    changeToLogin();
    limparDados();
    login();
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

function limparDados() {
    clearInterval(intervalMessages);
    clearInterval(intervalParticipants);
    clearInterval(intervalStatus);
    usuarios = [];
    mensagens = [];
    currentUser = { nome: null };
    visibilidadeDeEnvio = "Público";
    usuario = "Todos";
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
        case "private_message":
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

function inserirUsuario(usuarioToInsert) {
    const divUsuarios = document.querySelector(".usuario-container");
    const divUsuario = `<div onclick="onTapUsuario(this)" class="usuario"><img src="./assets/images/perfis.svg"
                        alt="Ícone de Mensagem para todos"><span>${usuarioToInsert.nome}</span><img
                        src="./assets/images/check.svg" alt="Icone de seleçao" style="visibility: ${usuario == usuarioToInsert.nome ? 'visible' : 'hidden'}">
                </div>`;
    divUsuarios.innerHTML += divUsuario;
}

function limparDivPrincipal() {
    const divMain = document.querySelector("main");
    divMain.innerHTML = "";
}

function limparDivUsuarios(usuarios) {
    const divUsuarios = document.querySelector(".usuario-container");
    divUsuarios.innerHTML = `<div>Escolha um contato para enviar mensagens:</div>
                <div onclick="onTapUsuario(this)" class="usuario"><img src="./assets/images/perfis.svg"
                        alt="Ícone de Mensagem para todos"><span>Todos</span><img style="visibility: ${usuarios.some(e => e.nome === usuario) ? 'hidden' : 'visible'}"
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
    if (mensagem.to == currentUser.nome || mensagem.to == "Todos" || mensagem.from == currentUser.nome) {
        if (mensagem.type == "message") {
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
