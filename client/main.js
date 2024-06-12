import { DiscordSDK } from "@discord/embedded-app-sdk";
import rocketLogo from '/rocket.png';
import sushi from './sushi.png';
import "./style.css";
import ytdl from 'ytdl-core';
import fs from 'fs-extra';

// Will eventually store the authenticated user's access_token
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
    console.log("Discord SDK is authenticated");
});

async function setupDiscordSdk() {
    await discordSdk.ready();
    console.log("Discord SDK is ready");

    // Authorize with Discord Client
    const { code } = await discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: [
            "identify",
            "guilds",
        ],
    });

    // Retrieve an access_token from your activity's server
    const response = await fetch("/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code,
        }),
    });
    const { access_token } = await response.json();

    // Authenticate with Discord client (using the access_token)
    auth = await discordSdk.commands.authenticate({
        access_token,
    });

    if (auth == null) {
        throw new Error("Authenticate command failed");
    }
}

async function getUserAvatar() {
    const app = document.querySelector('#app');

    // Fetch user information from the Discord API
    const user = await fetch(`https://discord.com/api/v10/users/@me`, {
        headers: {
            Authorization: `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json',
        },
    }).then((response) => response.json());

    // Get the user's avatar
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

    return avatarUrl;
}

// Fonction pour télécharger la chanson
function downloadSong() {
    const url = "https://youtu.be/uGSu6mhk3RQ";
    ytdl(url, { filter: 'audioonly' })
        .pipe(fs.createWriteStream('audio.mp3'))
        .on('finish', () => {
            console.log('download complete');
        });
    console.log('download started');
}

// Fonction pour jouer la chanson
function playSong() {
    const songPath = './audio.mp3';
    if (fs.existsSync(songPath)) {
        console.log('songmp3', songPath);
        // Utilisation de l'API HTML5 Audio pour jouer la chanson
        const audio = new Audio(songPath);
        audio.play();
    } else {
        console.log('no songmp3');
    }
}

import playSvg from './svgs/play-circle-svgrepo-com.svg'

document.querySelector('#app').innerHTML = `
    <div>
        <img src="${sushi}" class="logo" alt="Discord" />
        <h1>Sushi Music</h1>
        <!-- Add a message input field -->
        <input class="inputfield" type="text" id="message" placeholder="Song name/link" />
        <!-- Add a send button -->
        <button class="send">Search</button>
        <div class="main">
            <div class="player">
                <img src="${playSvg}" class="play" alt="Play" />
            </div>
        </div>
    </div>
`;

// Ajoutez cette ligne juste avant la fin de votre code JavaScript existant
document.querySelector('.play').addEventListener('click', playSong)
document.querySelector('.send').addEventListener('click', downloadSong)