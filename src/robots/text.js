const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apikey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const { IamAuthenticator } = require('ibm-watson/auth');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1')

var nlu = new NaturalLanguageUnderstandingV1({
  version: '2018-04-05',
  authenticator: new IamAuthenticator({
    apikey: watsonApiKey
  }),
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/',
  
})


async function robot(content) {
  
  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)
  limitMaximumSentences(content)
  await fetchKeywordsOfAllSentences(content)

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
    // eslint-disable-next-line no-regex-spaces
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
  }

  //Limitar sentenças
  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences)
  }

  //Função que busca e retorna a palavra chave das frases retornadas da procura
  //no input, iterando em cada sentença (Natural Language Understanding)
  async function fetchKeywordsOfAllSentences(content) {
    for(const sentence of content.sentences){
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    }
  }

  //Função que busca a palavra chave das frases retornadas da busca (Natural Language Understanding)
  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu.analyze({
        text: sentence,
        features: {
          keywords: {}
        }
      }, (error, response) => {
        if (error) {
          reject(error)
          return
        }

        const keywords = response.result.keywords.map((keyword) => {
          return keyword.text
        })

        resolve(keywords)
      })
    })
  }
    
  //console.log(sentences)
}

module.exports = robot