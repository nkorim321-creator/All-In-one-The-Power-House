// ==UserScript==
// @name         Protected Script
// @version      1.27
// @description  Super Fast Password-Protected Loader (HIT Catcher Optimized)
// @match        *://*/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_closeBrowserTab
// @updateURL    https://raw.githubusercontent.com/nkorim321-creator/All-In-one-The-Power-House/main/PowerFull.user.js
// @downloadURL  https://raw.githubusercontent.com/nkorim321-creator/All-In-one-The-Power-House/main/PowerFull.user.js
// @connect      gist.githubusercontent.com
// @connect      gist.github.com
// @connect      docs.google.com
// @connect      38.58.179.188
// @connect      *.sagemaker.aws
// @connect      api.wit.ai
// @connect      www.google.com
// @connect      google.com
// @connect      recaptcha.net
// @connect      *.google.com
// @connect      *.gstatic.com
// ==/UserScript==

(async function () {
    'use strict';
    
    // Apnar Github Gist er RAW link
    const PAYLOAD_URL = 'https://gist.github.com/nkorim321-creator/2ad928b3bcfdcd495fa247bbba04e044/raw/c4580d798ceda1c792757eae1d95df9af064c452/6.11.2026.json';
    
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
    
    let isPrompting = false;

    async function executeCode(payloadStr) {
        let payload;
        try {
            payload = JSON.parse(payloadStr);
        } catch (e) {
            console.error("Failed to parse protected payload", e);
            return;
        }

        let savedPass = await GM_getValue('notun_script_pass', '');
        if (!savedPass) {
            if (isPrompting) return;
            isPrompting = true;
            try {
                savedPass = prompt('Please enter the secret password to unlock the script:');
            } finally {
                isPrompting = false;
            }
            if (!savedPass) return alert('Password required to run the script!');
        }

        let sourceCode;
        try {
            sourceCode = await decryptEncPayload(payload, savedPass);
        } catch (err) {
            await GM_setValue('notun_script_pass', '');
            alert('Wrong Password! Please reload the page and try again.');
            return;
        }

        await GM_setValue('notun_script_pass', savedPass);

        function runCode() {
            try { eval(sourceCode); } catch (e) { console.error("Protected script runtime error (password OK):", e); }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runCode);
        } else {
            runCode();
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
