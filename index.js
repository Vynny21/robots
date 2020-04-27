const readline = require('readline-sync');
const robots = {
  text: require('./src/robots/text')
}

//Orquestrador
async function start(){
  const content = {
    maximumSentences: 7
  }

  //Retorno das funções nas propriedades e depois elas retornam no objeto content
  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix();

  //Inicializar os robos passando o content dentro da função base do robô
  await robots.text(content)

  //Ler a resposta do input
  function askAndReturnSearchTerm() {
    return readline.question('type a Wikipedia search term: ');
  }

  //Escolha do prefixo e retorno da chave escolhida pelo usuário
  function askAndReturnPrefix() {
    const prefixes = ['Who is', 'What is', 'The history of', ];
    const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option:');
    const selectedPrefixText = prefixes[selectedPrefixIndex];

    return selectedPrefixText
  }

  console.log(JSON.stringify(content, null, 4))
}

start()