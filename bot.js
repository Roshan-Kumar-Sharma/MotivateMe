const Discord = require('discord.js')
const Database = require("@replit/database")
const axios = require('axios')
const keepAlive = require('./server')
// let fetch 
// import('node-fetch').then(node => fetch = node)
const db = new Database()

const sadWords = ['sad', 'depressed', 'scared', 'unhappy', 'disappointed', 'angry', 'confused', 'demotivated', 'anxious', 'broken', 'failed', 'fail']


const starterEncouragements = ['Cheer up!', 'Hang in there.', 'You are a great person', 'You are a genius', 'Smile will look good at your face.']

const features = [
  "$inspire - Get a inspiring quote",
  "$new <Encouraging Message> - Add new encouraging message to the list", 
  "$del <index> - Delete encouraging message at 'index'",
  "$list - Lists all encouraging messages",
  "$responding <true/false> - Unmute/Mute the bot for sad words",
]
// db.list().then(keys => {
// console.log(keys)
// for(let i=0; i<keys.length; ++i){
//     db.delete(keys[i]);
// }
// });

db.get('responding').then(value => {
  if(value == null){
    db.set('responding', true)
  }
})

db.get('encouragements').then(encouragements => {
  if(!encouragements || encouragements < 1){
    db.set('encouragements', starterEncouragements)
  }
})

function updateEncouragement(encouragingMessage) {
  db.get('encouragements').then(encouragements => {
    encouragements.push(encouragingMessage)
    db.set('encouragements', encouragements)
  })
}

function deleteEncouragement(index){
  return new Promise((res, rej) => {
    let flag = 0
    db.get('encouragements').then(encouragements => {
      if(encouragements.length > index){
        const encouragement = encouragements.splice(index, 1)
        flag = encouragement
        db.set('encouragements', encouragements)
        res(flag)
      }
    })
  })
}

const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]})

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageCreate', async (msg) => {
  if(msg.author.bot) return

  if(msg.content === "$inspire"){
    const quote = await getQuote()
    // console.log(quote)
    msg.channel.send (quote)
  }

  if(msg.content === "$help"){
    msg.reply(features.join("\n"))
  }

  db.get("responding").then(responding => {
    if(responding && sadWords.some(word => msg.content.includes(word)))
    {
      db.get('encouragements').then(encouragements =>   {
        // console.log(encouragements)
        const encourage = encouragements[Math.floor (Math.random() * encouragements.length)]
        msg.reply(encourage)
      })
    }
  })

  if(msg.content == "$list"){
    db.get('encouragements').then(encouragements => {
      console.log(encouragements)
      msg.channel.send(encouragements.join('\n'))
    })
  }

  if(msg.content.startsWith("$responding")){
    const value = msg.content.split("$responding ")[1]
    if(value.toLowerCase() == 'true'){
      db.set('responding', true)
      msg.channel.send('Thank You for unmuting me...')
    }
    else{
      db.set('responding', false)
      msg.channel.send('I am mute now...')
    }
  }

  if(msg.content.startsWith("$new")){
    encouragingMessage = msg.content.split("$new ")[1]
    if(encouragingMessage){
      updateEncouragement(encouragingMessage)
      msg.channel.send(`New encouraging message added => ${encouragingMessage}`)
    }
  }

  if(msg.content.startsWith("$del")){
    const index = parseInt(msg.content.split(" ")[1])
    const flag = await deleteEncouragement(index)
    if(flag) msg.channel.send(`${flag} - This encouraging message has been deleted`)
  }
})

const token = process.env['TOKEN']

keepAlive()

client.login(token)

async function getQuote(){
  try{
    const fetch = await axios.get(`https://zenquotes.io/api/random/${process.env.API_KEY}`)
    // console.log(fetch)
    const {q, a} = fetch.data[0];
    console.log(q, a)
    return `${q} - ${a}`
  }
  catch(err){
    console.log('AxiosError : \n' + err.message)
  }
}

// getQuote()

