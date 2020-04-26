const readline = require('readline-sync');

//Orquestrador
function start(){
  const content = {}

  //Retorno das funções nas propriedades e depois retornaram no array content
  content.searchTerm = askAndReturnSearchTerm();
  content.prefix = askAndReturnPrefix();

  //Ler a resposta do input
  function askAndReturnSearchTerm() {
    return readline.question('type a Wikipedia search term: ');
  }

  //Escolha do prefixo e retorno da chave escolhida pelo usuário
  function askAndReturnPrefix() {
    const prefixes = ['Who is', 'What is', 'The history of', ];
    const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option:');
    const selectedPrefixText = prefixes[selectedPrefixIndex];

    console.log(selectedPrefixText)
  }

  console.log(content)
}

start()