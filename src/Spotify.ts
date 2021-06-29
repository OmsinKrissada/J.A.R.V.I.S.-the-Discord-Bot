import axios from 'axios';
import querystring from 'querystring';
import { logger } from './Logger';
console.log('spotify ready');

let accessToken: string = null;

async function refreshAccessToken() {
	try {
		accessToken = (await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({ 'grant_type': 'client_credentials' }),
			{
				auth: {
					username: 'a48092e160694ccbae51b91983f910bb',
					password: '1e1e98a33c3b4168bd8d5721b3f41b7c'
				}
			})).data.access_token;
		logger.debug(accessToken);
	} catch (err) {
		if (axios.isAxiosError(err)) {
			logger.error(err.message);
		} else logger.error(err);
	}
}
// refreshAccessToken().then(() => {
// 	getTrackSearchString(['0B96zn11fA3apNGZqERmPO']);

// });

// async function getTracksFromPlaylist(id:string) {
// 	try {
// 		const items:any[] = (await axios.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
// 			headers: {
// 				Authorization: `Bearer ${accessToken}`
// 			},
// 			params: { fields: 'items(track(name,href,artists(name)))' }
// 		})).data.items;

// items.map()

// 		logger.debug(`${name} ${artists[0].name}`);
// 		return `${name} ${artists[0].name}`;
// 	} catch (err) {
// 		if (axios.isAxiosError(err)) {
// 			if (err.response.status == 401) {
// 				await refreshAccessToken();
// 				return await getTrackSearchString(id);
// 			} else logger.error(`${err.message}: ${JSON.stringify(err.response.data.error)}`);
// 		} else logger.error(err);
// 	}
// }

export async function getTrackSearchString(id: string): Promise<{ name: string, artist: string, href: string, thumbnail_url: string; }> {
	try {
		const { name, artists, album } = (await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			},
		})).data;
		logger.debug(`${artists[0].name} ${name}`);
		return { name: name, artist: artists[0].name, href: `https://open.spotify.com/track/${id}`, thumbnail_url: album.images[album.images.length - 1].url };
	} catch (err) {
		if (axios.isAxiosError(err)) {
			if (err.response.status == 401) {
				await refreshAccessToken();
				return await getTrackSearchString(id);
			} else logger.error(`${err.message}: ${JSON.stringify(err.response.data.error)}`);
		} else console.error(err);
	}
	return null;
}



// axios.request({
// 	url: 'https://accounts.spotify.com/api/token',
// 	method: 'post',
// 	auth: {
// 		username: 'a48092e160694ccbae51b91983f910bb',
// 		password: '1e1e98a33c3b4168bd8d5721b3f41b7c'
// 	},
// 	data: {
// 		"grant_type": "client_credentials"
// 	}
// }).then(res => {
// 	console.log(res.data);
// 	process.exit();
// 	return;
// });
console.log('requested');