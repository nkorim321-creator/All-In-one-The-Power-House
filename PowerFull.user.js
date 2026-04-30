// ==UserScript==
// @name         Protected Script
// @version      1.06
// @description  Super Fast Password-Protected Loader (HIT Catcher Optimized)
// @match        https://worker.mturk.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/nkorim321-creator/All-In-one-The-Power-House/main/PowerFull.user.js
// @downloadURL  https://raw.githubusercontent.com/nkorim321-creator/All-In-one-The-Power-House/main/PowerFull.user.js
// @connect      gist.githubusercontent.com
// ==/UserScript==

(async function () {
    'use strict';
    
    // Apnar Github Gist er RAW link
    const PAYLOAD_URL = 'https://gist.githubusercontent.com/nkorim321-creator/d9441f34ba8d567477960c6249bd41a1/raw/ATN4.30.26.json';
    
    function b64ToBytes(b64) {
        const raw = atob(b64);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
        return out;
    }
    
    async function decryptEncPayload(payload, password) {
        const iter = payload.iter;
        const salt = b64ToBytes(payload.salt);
        const iv = b64ToBytes(payload.iv);
        const tag = b64ToBytes(payload.tag);
        const data = b64ToBytes(payload.data);
        const cipherWithTag = new Uint8Array(data.length + tag.length);
        cipherWithTag.set(data, 0); 
        cipherWithTag.set(tag, data.length);
        
        const baseKey = await crypto.subtle.importKey(
            'raw', 
            new TextEncoder().encode(password), 
            'PBKDF2', 
            false, 
            ['deriveKey']
        );
        const aesKey = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
            baseKey, 
            { name: 'AES-GCM', length: 256 }, 
            false, 
            ['decrypt']
        );
        const plainBuf = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv }, 
            aesKey, 
            cipherWithTag
        );
        return new TextDecoder().decode(plainBuf);
    }
    
    async function executeCode(payloadStr) {
        try {
            const payload = JSON.parse(payloadStr);
            let savedPass = await GM_getValue('notun_script_pass', '');
            if (!savedPass) {
                savedPass = prompt('Please enter the secret password to unlock the script:');
                if (!savedPass) return alert('Password required to run the script!');
            }
            try {
                const sourceCode = await decryptEncPayload(payload, savedPass);
                await GM_setValue('notun_script_pass', savedPass);
                eval(sourceCode);
            } catch (err) {
                await GM_setValue('notun_script_pass', '');
                alert('Wrong Password! Please reload the page and try again.');
            }
        } catch (e) {
            console.error("Failed to parse or execute the protected script", e);
        }
    }
    
    // Smart Caching System (HIT Catcher Optimized - 6 hour cache)
    let cachedPayload = await GM_getValue('notun_cached_payload', '');
    let lastFetchTime = await GM_getValue('notun_last_fetch', 0);
    let currentTime = Date.now();
    let cacheTimeLimit = 6 * 60 * 60 * 1000; // 6 hours - fast page reloads
    
    if (!cachedPayload) {
        // First time - synchronous fetch
        GM_xmlhttpRequest({
            method: 'GET',
            url: PAYLOAD_URL,
            onload: async function (r) {
                if (r.status === 200) {
                    await GM_setValue('notun_cached_payload', r.responseText);
                    await GM_setValue('notun_last_fetch', currentTime);
                    executeCode(r.responseText);
                }
            }
        });
    } else {
        // ⚡ FAST PATH: Cache theke instant execute
        executeCode(cachedPayload);
        
        // Background e check korbe — cache expire hoyeche kina
        if (currentTime - lastFetchTime > cacheTimeLimit) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: PAYLOAD_URL,
                onload: async function (r) {
                    if (r.status === 200) {
                        await GM_setValue('notun_cached_payload', r.responseText);
                        await GM_setValue('notun_last_fetch', currentTime);
                        // Notun version next page load e cholbe
                    }
                }
            });
        }
    }
})();
