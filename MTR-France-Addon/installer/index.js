async function generatePack() {
    const zip = new JSZip();

    const packMeta = {
        "pack": {
            "pack_format": 22,
            "description": "Pack MTR France personnalisé"
        }
    };
    zip.file("pack.mcmeta", JSON.stringify(packMeta, null, 2));

    const checkboxes = document.querySelectorAll('.ext-checkbox:checked');

    if(checkboxes.length === 0) {
        alert("Veuillez sélectionner au moins une extension.");
        return;
    }

    const idPack = await EncryptCode(checkboxes);
    const assetsFolder = zip.folder("assets");

    let mtr_custom_resources = {
        "vehicles": [],
        "signs": [],
        "rails": [],
        "objects": [],
        "lifts": []
    }

    for (const checkbox of checkboxes) {
        const namespaceName = checkbox.value;
        const namespaceFolder = assetsFolder.folder(namespaceName);
        await namespaceFolder.loadAsync((await fetch(`https://mtr-france-team.github.io/MTR-France-Addon/installer/src/extensions/${namespaceName}.zip`)).blob())
        let mtr_custom = await namespaceFolder.file("mtr_custom_resources.json")
        let json = await JSON.parse(await mtr_custom.async("text"))
        for (const [k, v] of Object.entries(mtr_custom_resources)) {
            mtr_custom_resources[k].push(json[k])
        }

    }
    assetsFolder.folder("mtr").file("mtr_custom_resources.json", JSON.stringify(mtr_custom_resources, null, 2))

    zip.generateAsync({ type: "blob" })
        .then(function(content) {
            saveAs(content, `MTR_FRA_RP-${idPack}.zip`);
        });
}

const CATALOGUE = fetch("https://mtr-france-team.github.io/MTR-France-Addon/installer/src/extensions.json").then(res => res.json()).catch(e => {return})

/**
 * Génère un identifiant court basé sur les IDs uniques
 */
async function EncryptCode(extensions) {
    let valeurDecimale = 0;

    for (const name of extensions) {
        const extension = (await CATALOGUE).find(ext => ext.namespace === name.value);

        if (extension) {
            valeurDecimale += Math.pow(2, extension.id);
        }
    }

    return valeurDecimale.toString(36).toUpperCase();
}

/**
 * Décrypte un identifiant et retourne la liste des namespaces
 */
function DecryptCode(code) {
    const valeurDecimale = parseInt(code.toLowerCase(), 36);
    const binaire = valeurDecimale.toString(2);
    const binaireInverse = binaire.split('').reverse().join('');
    const extensionsACocher = [];

    for (let i = 0; i < binaireInverse.length; i++) {
        if (binaireInverse[i] === '1') {
            const extension = CATALOGUE.find(ext => ext.id === i);
            if (extension) {
                extensionsACocher.push(extension.namespace);
            }
        }
    }

    return extensionsACocher;
}

/**
 * Detecte et affiche les extensions
 */
async function detectExtensions() {
    const extensions = await CATALOGUE
    extensions.forEach(k => {
        const div = document.createElement("div")
        div.classList.add("extension-card")
        div.innerHTML = `<img src="src/images/${k.namespace}.png" alt="${k.name}" height="100" width="100" />
        <h3>${k.name}</h3>
        <label><input type="checkbox" class="ext-checkbox" value="${k.namespace}">Ajouter</label>`
        document.querySelector(".catalogue").appendChild(div)
    })
}

detectExtensions()