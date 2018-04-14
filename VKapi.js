const vkapi = 	new (require('node-vkapi'))();
const { Bot } = require('node-vk-bot');

class VKapi{
    constructor(login, password, token){
        this.login = login;
        this.password = password;
        this.bot = new Bot({
            token: token
        });
    }

    async authorize(){
        let client = this;
        try{
            await vkapi.authorize({
                login:  	client.login,
                password: 	client.password
            });
        }catch(e){
            throw e;
        }
        console.log('Loggined in VK');
    }

    async follows(id){
        let res;
        try{
            res = await vkapi.call('users.getSubscriptions',{
                user_id: 	id
            });
        }catch(e){
            throw e;
        }

        return res.users.items.concat(res.groups.items);
    }

    send(msg,peer){
        this.bot.send(msg,peer).catch(e=>console.dir(e));
    }

    async userFollows(name){
        try{
            let res =  await vkapi.call('users.get',{
                user_ids: name
            });
            res = await vkapi.call('users.getSubscriptions',{
                user_id: 	res[0].id
            });
            return res.users.items.concat(res.groups.items);
        }catch(e){
            throw(e);
        }
    }
}

module.exports = VKapi;