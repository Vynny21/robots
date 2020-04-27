const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apikey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
  
  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)

  async function fetchContentFromWikipedia() {
    const algorithmiaAutenticated = algorithmia(algorithmiaApiKey)
    const wikipediaAlgorithm = algorithmiaAutenticated.algo('web/WikipediaParser/0.1.2')

    //Busca do termo digitado no input no wikipedia
    const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
    const wikipediaContent = wikipediaResponde.get()

    content.sourceContentOriginal = wikipediaContent.content
  }

  //Limpar o retorno da pesquisa
  function sanitizeContent(content) {
    const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
    const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
    
    content.sourceContentSanitized = withoutDatesInParentheses 

    //Remover as linhas em branco fazendo um filtro em cada linha
    function removeBlankLinesAndMarkdown(text) {
      const allLines = text.split('\n')
      
      const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
        if(line.trim().length === 0 || line.trim().startsWith('=')){
          return false //se a linha é vazia e começa com o caractere "=", ela é excluida
        }
        return true //Se a linha não é vazia não começa com o "=", ela é mantida
      })
      //Juntar tudo num só texto e inserir espaços onde é preciso
      return withoutBlankLinesAndMarkdown.join(' ')
    }
  }

  function removeDatesInParentheses(text) {
    return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
  }

  //Quebrando o conteúdo sanitizado passado na const sentences em linhas depois do ponto final
  function breakContentIntoSentences(content) {
    //Passando o conteúdo formatado em linhas para dentro do array sentences dentro do objeto content
    content.sentences = []

    const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
    //Mapeando o array sentences e para cada sentença, ele vai injetar os objetos abaixo dentro do objeto
    //content atraves do array sentences
    sentences.forEach((sentence) => {
      content.sentences.push({
        text: sentence,
        keywords: [],
        images: [],
      })
    })
    
    console.log(sentences)
  }
}

module.exports = robot;