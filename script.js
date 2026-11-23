const API_URL = "https://api.profmalta.site";
const CHAVE_CARTAS = "cartas_yugioh";

const btnIniciar = document.getElementById("btn-iniciar");
const mao = document.getElementById("mao");
const campoJogador = document.getElementById("campo-jogador");
const campoAdversario = document.getElementById("campo-adversario");
const cemiterio = document.getElementById("cemiterio");
const info = document.getElementById("info");

let cartaSelecionada = null;
let cartaAtacante = null;
let dueloIniciado = false;

function mostrarInfo(mensagem) {
    info.textContent = mensagem;
}

function limparJogo() {
    mao.innerHTML = "";
    campoAdversario.innerHTML = "";

    campoJogador.querySelectorAll(".slot").forEach(slot => {
        slot.innerHTML = "";
    });

    cemiterio.innerHTML = "";

    cartaSelecionada = null;
    cartaAtacante = null;
    dueloIniciado = false;
}

function cartaValida(carta) {
    return (
        carta &&
        typeof carta.nome === "string" &&
        carta.nome.trim() !== "" &&
        typeof carta.atk === "number" &&
        typeof carta.def === "number" &&
        typeof carta.imagem === "string" &&
        carta.imagem.trim() !== ""
    );
}

function embaralhar(cartas) {
    const resultado = [...cartas];

    for (let i = resultado.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [resultado[i], resultado[j]] = [
            resultado[j],
            resultado[i]
        ];
    }

    return resultado;
}

function criarCarta(carta, adversaria = false) {
    const elemento = document.createElement("div");

    elemento.classList.add("carta");

    if (adversaria) {
        elemento.classList.add("carta-adversaria");
    }

    elemento.dataset.nome = carta.nome;
    elemento.dataset.atk = carta.atk;
    elemento.dataset.def = carta.def;

    const imagem = document.createElement("img");
    imagem.src = carta.imagem;
    imagem.alt = carta.nome;

    const nome = document.createElement("strong");
    nome.textContent = carta.nome;

    const atributos = document.createElement("div");
    atributos.classList.add("atributos");

    const ataque = document.createElement("span");
    ataque.textContent = `ATK: ${carta.atk}`;

    const defesa = document.createElement("span");
    defesa.textContent = `DEF: ${carta.def}`;

    atributos.appendChild(ataque);
    atributos.appendChild(defesa);

    elemento.appendChild(imagem);
    elemento.appendChild(nome);
    elemento.appendChild(atributos);

    return elemento;
}

function selecionarCartaDaMao(carta) {
    if (!dueloIniciado) {
        return;
    }

    if (cartaSelecionada) {
        cartaSelecionada.classList.remove("selecionada");
    }

    cartaSelecionada = carta;
    cartaSelecionada.classList.add("selecionada");

    mostrarInfo(
        `Carta selecionada: ${carta.dataset.nome}. Escolha um espaço no seu campo.`
    );
}

function configurarCartasDaMao() {
    mao.querySelectorAll(".carta").forEach(carta => {
        carta.addEventListener("click", () => {
            selecionarCartaDaMao(carta);
        });
    });
}

function colocarCartaNoCampo(slot) {
    if (!cartaSelecionada) {
        mostrarInfo("Selecione uma carta da mão primeiro.");
        return;
    }

    if (slot.querySelector(".carta")) {
        mostrarInfo("Este espaço já está ocupado.");
        return;
    }

    const carta = cartaSelecionada;

    slot.appendChild(carta);

    carta.classList.remove("selecionada");

    mostrarInfo(
        `${carta.dataset.nome} foi colocada no seu campo.`
    );

    cartaSelecionada = null;
}

function configurarSlots() {
    campoJogador.querySelectorAll(".slot").forEach(slot => {
        slot.addEventListener("click", () => {
            colocarCartaNoCampo(slot);
        });
    });
}

function selecionarAtacante(carta) {
    if (cartaAtacante) {
        cartaAtacante.classList.remove("selecionada");
    }

    cartaAtacante = carta;
    cartaAtacante.classList.add("selecionada");

    mostrarInfo(
        `${carta.dataset.nome} foi selecionada como atacante. Escolha um monstro adversário.`
    );
}

function configurarCampoJogador() {
    campoJogador.addEventListener("click", evento => {
        const carta = evento.target.closest(".carta");

        if (!carta) {
            return;
        }

        if (!carta.parentElement.classList.contains("slot")) {
            return;
        }

        selecionarAtacante(carta);
    });
}

function enviarParaCemiterio(carta) {
    carta.classList.remove("selecionada");

    cemiterio.appendChild(carta);

    if (carta === cartaAtacante) {
        cartaAtacante = null;
    }
}

function resolverAtaque(defensor) {
    if (!cartaAtacante) {
        mostrarInfo("Selecione uma carta atacante primeiro.");
        return;
    }

    const atacante = cartaAtacante;

    const atkAtacante = Number(atacante.dataset.atk);
    const atkDefensor = Number(defensor.dataset.atk);

    const nomeAtacante = atacante.dataset.nome;
    const nomeDefensor = defensor.dataset.nome;

    if (atkAtacante > atkDefensor) {
        enviarParaCemiterio(defensor);

        mostrarInfo(
            `${nomeAtacante} venceu ${nomeDefensor}.`
        );
    } else if (atkDefensor > atkAtacante) {
        enviarParaCemiterio(atacante);

        mostrarInfo(
            `${nomeDefensor} venceu ${nomeAtacante}.`
        );
    } else {
        enviarParaCemiterio(atacante);
        enviarParaCemiterio(defensor);

        mostrarInfo(
            `${nomeAtacante} e ${nomeDefensor} foram destruídos.`
        );
    }
}

function configurarCampoAdversario() {
    campoAdversario.addEventListener("click", evento => {
        const carta = evento.target.closest(".carta");

        if (!carta) {
            return;
        }

        resolverAtaque(carta);
    });
}

async function buscarCartasDaAPI() {
    const resposta = await fetch(API_URL);

    if (!resposta.ok) {
        throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (
        !dados ||
        !Array.isArray(dados.monstros)
    ) {
        throw new Error(
            "Formato de resposta da API inválido."
        );
    }

    const cartasValidas = dados.monstros.filter(cartaValida);

    if (cartasValidas.length < 8) {
        throw new Error(
            "A API não retornou pelo menos 8 cartas de monstros válidas."
        );
    }

    localStorage.setItem(
        CHAVE_CARTAS,
        JSON.stringify(cartasValidas)
    );

    console.log(
        `API consultada. ${cartasValidas.length} cartas salvas no localStorage.`
    );

    return cartasValidas;
}

function obterCartasDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_CARTAS);

    if (!dadosSalvos) {
        return null;
    }

    try {
        const cartas = JSON.parse(dadosSalvos);

        if (!Array.isArray(cartas)) {
            return null;
        }

        const cartasValidas = cartas.filter(cartaValida);

        if (cartasValidas.length < 8) {
            return null;
        }

        console.log(
            `Usando ${cartasValidas.length} cartas salvas no localStorage.`
        );

        return cartasValidas;
    } catch (erro) {
        console.error(
            "Erro ao ler localStorage:",
            erro
        );

        return null;
    }
}

async function obterCartas() {
    const cartasSalvas = obterCartasDoLocalStorage();

    if (cartasSalvas) {
        console.log(
            "Cartas encontradas no localStorage. Fetch não será realizado."
        );

        return cartasSalvas;
    }

    console.log(
        "Nenhuma carta encontrada no localStorage. Fazendo fetch..."
    );

    return await buscarCartasDaAPI();
}

async function iniciarDuelo() {
    limparJogo();

    mostrarInfo("Carregando cartas...");

    btnIniciar.disabled = true;

    try {
        const cartas = await obterCartas();

        const cartasEmbaralhadas = embaralhar(cartas);

        const cartasJogador = cartasEmbaralhadas.slice(0, 5);
        const cartasAdversario = cartasEmbaralhadas.slice(5, 8);

        cartasJogador.forEach(carta => {
            const elemento = criarCarta(carta);
            mao.appendChild(elemento);
        });

        cartasAdversario.forEach(carta => {
            const elemento = criarCarta(carta, true);
            campoAdversario.appendChild(elemento);
        });

        configurarCartasDaMao();

        dueloIniciado = true;

        mostrarInfo(
            "Duelo iniciado! Selecione uma carta da sua mão."
        );
    } catch (erro) {
        console.error(
            "Erro ao iniciar duelo:",
            erro
        );

        mostrarInfo(
            `Não foi possível iniciar o duelo: ${erro.message}`
        );
    } finally {
        btnIniciar.disabled = false;
    }
}

btnIniciar.addEventListener(
    "click",
    iniciarDuelo
);

configurarSlots();
configurarCampoJogador();
configurarCampoAdversario();