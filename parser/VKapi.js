const vkapi = 	new (require('node-vkapi'))();

class VKapi{
    constructor(login, password, group, album){
        this.login = login;
        this.password = password;
        this.group = group;
        this.album = album;
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

    async photos(offset, count){
        let client = this,
            response;
        try{
            response = await vkapi.call('photos.get',{
                owner_id: 		client.group,
                album_id: 		client.album,
                count: 			count,
                rev: 			0,
                offset: 		offset
            });
        }catch(e){
            throw e;
        }
        return response;
    }

    async listComs(id){
        let client = this;
        let response;
        try{
            response = await vkapi.call('photos.getComments',{
                owner_id: this.group,
                photo_id: id
            });
        }catch(e){
            throw e;
        }
        return response.items;
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
}

module.exports = VKapi;