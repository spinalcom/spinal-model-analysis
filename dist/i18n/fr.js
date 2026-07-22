"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FR = void 0;
/** Description française partagée du paramètre updateDirectModificationDate. */
const UPDATE_DIRECT_MODIFICATION_DATE_FR = 'Si vrai, met aussi à jour node.info.directModificationDate avec l\'heure courante lors ' +
    'de la modification, afin que le BOS puisse détecter la modification directe (par défaut : faux).';
/**
 * French translations for algorithm metadata, keyed by the stable algorithm name.
 *
 * Structure per entry: { label?, description?, inputs?: { <inputName>: fr },
 * parameters?: { <paramName>: fr } }. The algorithm `name` and the input/parameter
 * `name`s are stable identifiers and are NOT translated — only display text is.
 *
 * Any algorithm (or field) not listed here falls back to English via
 * localizeAlgorithm(), so the app never shows blanks. This bundle covers all
 * current algorithms; keep it in sync as algorithms are added or their English text
 * changes (translations lag the source until updated).
 */
exports.FR = {
    // ── number ──
    COPY_FIRST_NUMBER: {
        label: 'Premier nombre',
        description: 'Renvoie le nombre en entrée, ou le premier élément d\'un tableau de nombres. Les chaînes numériques sont acceptées.',
        inputs: { numbers: 'Un ou plusieurs nombres (ou chaînes numériques) ; le premier est renvoyé.' },
    },
    SUM_NUMBERS: {
        label: 'Somme',
        description: 'Additionne tous les nombres reçus en entrée. Les chaînes numériques sont acceptées.',
        inputs: { numbers: 'Un ou plusieurs nombres (ou chaînes numériques) à additionner.' },
    },
    SUBTRACT: {
        label: 'Soustraction',
        description: 'Soustrait les nombres dans l\'ordre à partir du tableau en entrée : input[0] − input[1] − … Requiert au moins deux nombres (ex. deux entrées [a, b] → a − b). Les chaînes numériques sont acceptées.',
        inputs: { numbers: 'Deux nombres ou plus (ou chaînes numériques) ; les suivants sont soustraits du premier.' },
    },
    RANDOM_NUMBER: {
        label: 'Nombre aléatoire',
        description: 'Génère un nombre aléatoire entre min et max. Aucune entrée requise. Par défaut un flottant dans [min, max). Mettez « integer » à vrai pour un entier aléatoire dans [min, max] inclus.',
        parameters: {
            min: 'Borne inférieure (incluse).',
            max: 'Borne supérieure (flottant : exclue ; entier : incluse).',
            integer: 'Si vrai, renvoie un entier dans [min, max] inclus au lieu d\'un flottant. Faux par défaut.',
        },
    },
    CONSTANT_NUMBER: {
        label: 'Nombre constant',
        description: 'Produit un nombre constant à partir du paramètre « value ». Ne prend aucune entrée — utile comme source numérique pour alimenter des blocs de calcul ou de comparaison.',
        parameters: { value: 'Le nombre constant à produire.' },
    },
    ADD_PARAM: {
        label: 'Additionner',
        description: 'Ajoute le paramètre « value » au nombre en entrée (entrée + value).',
        inputs: { number: 'Le nombre en entrée (ou chaîne numérique).' },
        parameters: { value: 'Le nombre à ajouter à l\'entrée.' },
    },
    SUBTRACT_PARAM: {
        label: 'Soustraire (par valeur)',
        description: 'Soustrait le paramètre « value » du nombre en entrée (entrée − value).',
        inputs: { number: 'Le nombre en entrée (ou chaîne numérique).' },
        parameters: { value: 'Le nombre à soustraire de l\'entrée.' },
    },
    MULTIPLY_PARAM: {
        label: 'Multiplier',
        description: 'Multiplie le nombre en entrée par le paramètre « value » (entrée × value).',
        inputs: { number: 'Le nombre en entrée (ou chaîne numérique).' },
        parameters: { value: 'Le nombre par lequel multiplier l\'entrée.' },
    },
    DIVIDE_PARAM: {
        label: 'Diviser',
        description: 'Divise le nombre en entrée par le paramètre « value » (entrée ÷ value). Lève une erreur si value vaut 0.',
        inputs: { number: 'Le nombre en entrée (ou chaîne numérique).' },
        parameters: { value: 'Le nombre par lequel diviser l\'entrée (ne doit pas être 0).' },
    },
    POLYNOMIAL: {
        label: 'Polynôme',
        description: 'Évalue un polynôme à la valeur d\'entrée x. Les coefficients sont fournis via le paramètre « coefficients », un tableau JSON par puissances croissantes : [c0, c1, c2, ...] → c0 + c1·x + c2·x² + … Les chaînes numériques sont acceptées pour x.',
        inputs: { x: 'La valeur de x où évaluer le polynôme.' },
        parameters: { coefficients: 'Tableau JSON des coefficients par puissances croissantes : [c0, c1, c2, ...] pour c0 + c1·x + c2·x² + …' },
    },
    AVERAGE_NUMBERS: {
        label: 'Moyenne',
        description: 'Renvoie la moyenne arithmétique des nombres reçus en entrée. Les chaînes numériques sont acceptées.',
        inputs: { numbers: 'Un ou plusieurs nombres (ou chaînes numériques) à moyenner.' },
    },
    MIN_NUMBERS: {
        label: 'Minimum',
        description: 'Renvoie le plus petit des nombres reçus en entrée. Les chaînes numériques sont acceptées.',
        inputs: { numbers: 'Un ou plusieurs nombres (ou chaînes numériques).' },
    },
    MAX_NUMBERS: {
        label: 'Maximum',
        description: 'Renvoie le plus grand des nombres reçus en entrée. Les chaînes numériques sont acceptées.',
        inputs: { numbers: 'Un ou plusieurs nombres (ou chaînes numériques).' },
    },
    ROUND: {
        label: 'Arrondir',
        description: 'Arrondit le nombre en entrée à « decimals » décimales (0 par défaut). Les chaînes numériques sont acceptées.',
        inputs: { number: 'Le nombre en entrée (ou chaîne numérique).' },
        parameters: { decimals: 'Nombre de décimales pour l\'arrondi (0 par défaut).' },
    },
    ABS: {
        label: 'Valeur absolue',
        description: 'Renvoie la valeur absolue du nombre en entrée. Les chaînes numériques sont acceptées.',
        inputs: { number: 'Le nombre en entrée (ou chaîne numérique).' },
    },
    CLAMP: {
        label: 'Borner',
        description: 'Contraint le nombre en entrée à l\'intervalle [min, max]. Les chaînes numériques sont acceptées.',
        inputs: { number: 'Le nombre en entrée (ou chaîne numérique).' },
        parameters: { min: 'Borne inférieure (incluse).', max: 'Borne supérieure (incluse).' },
    },
    // ── node ──
    FIRST_NODE: {
        label: 'Premier nœud',
        description: 'Renvoie le nœud en entrée, ou le premier nœud d\'un tableau de nœuds.',
        inputs: { nodes: 'Un nœud, ou une liste de nœuds (le premier est renvoyé).' },
    },
    MERGE_NODES: {
        label: 'Fusionner des nœuds',
        description: 'Fusionne plusieurs entrées de nœuds en un seul tableau de SpinalNode. Chaque entrée peut être un nœud ou un tableau de nœuds — elles sont aplaties (d\'un niveau) en une seule liste, dans l\'ordre des entrées. Utile pour combiner par exemple les enfants de deux relations différentes. Mettez « deduplicate » à vrai pour retirer les nœuds présents plusieurs fois (par id). Renvoie [] si rien n\'est câblé.',
        inputs: { nodes: 'Deux nœuds et/ou tableaux de nœuds ou plus à fusionner.' },
        parameters: { deduplicate: 'Si vrai, ne garde chaque nœud qu\'une fois (par id), en conservant la première occurrence. Faux par défaut (simple concaténation).' },
    },
    GET_CONTEXT: {
        label: 'Récupérer un contexte',
        description: 'Renvoie le contexte (SpinalContext) portant le nom donné dans le graphe. Ne prend aucune entrée — le contexte est recherché par le paramètre « name ». Lève une erreur si aucun contexte ne porte ce nom.',
        parameters: { name: 'Le nom du contexte à récupérer.' },
    },
    GET_NODE_SERVER_ID: {
        label: 'ID serveur du nœud',
        description: 'Renvoie l\'identifiant d\'un nœud.',
        inputs: { node: 'Le nœud dont on veut l\'identifiant serveur.' },
    },
    SET_NODE_INFO: {
        label: 'Définir une info du nœud',
        description: 'Définit une propriété de l\'info d\'un nœud à une valeur d\'entrée dynamique. Prend 2 entrées : [nœud, valeur]. La clé de la propriété vient du paramètre « property ». Crée la propriété si elle n\'existe pas, sinon la met à jour en place (ex. renommer un nœud en définissant « name »). Ces propriétés d\'info sont celles sur lesquelles FILTER_NODE / FIND_NODE filtrent. Renvoie le nœud pour le chaînage. La propriété « id » est protégée et ne peut pas être modifiée.',
        inputs: {
            node: 'Le nœud dont on met à jour l\'info.',
            value: 'La valeur à affecter à la propriété d\'info.',
        },
        parameters: { property: 'La clé de la propriété d\'info à définir (ex. « name »).' },
    },
    SET_NODE_INFO_PARAM: {
        label: 'Définir une info du nœud (constante)',
        description: 'Définit une propriété de l\'info d\'un nœud à une valeur de paramètre statique. Prend 1 entrée : le nœud, et les paramètres « property » + « value ». Crée la propriété si elle n\'existe pas, sinon la met à jour en place (ex. renommer un nœud en définissant « name »). Ces propriétés d\'info sont celles sur lesquelles FILTER_NODE / FIND_NODE filtrent. Renvoie le nœud pour le chaînage. La propriété « id » est protégée et ne peut pas être modifiée.',
        inputs: { node: 'Le nœud dont on met à jour l\'info.' },
        parameters: {
            property: 'La clé de la propriété d\'info à définir (ex. « name »).',
            value: 'La valeur à affecter. Les chaînes numériques (« 42 ») et « true »/« false »/« null » sont converties dans leur type réel, si bien qu\'une nouvelle propriété numérique devient un Val (nombre). Utilisez SET_NODE_INFO (dynamique) si vous voulez que « 42 » reste du texte.',
        },
    },
    GET_NODE_CHILDREN: {
        label: 'Enfants du nœud',
        description: 'Renvoie les enfants d\'un nœud.',
        inputs: { node: 'Le nœud dont on veut les enfants.' },
        parameters: { regex: 'Motif regex sur le nom de la relation pour filtrer les enfants.' },
    },
    GET_NODE_PARENTS: {
        label: 'Parents du nœud',
        description: 'Renvoie les parents d\'un nœud.',
        inputs: { node: 'Le nœud dont on veut les parents.' },
        parameters: { regex: 'Motif regex sur le nom de la relation pour filtrer les parents.' },
    },
    GET_NODE_CHILD: {
        label: 'Trouver un enfant',
        description: 'Raccourci de GET_NODE_CHILDREN + FIND_NODE : renvoie le premier enfant du nœud dont une propriété correspond à une regex. « regex » limite les relations parcourues ; « filterProperty » (par défaut « name ») et « regexFilter » sélectionnent l\'enfant. Lève une erreur si aucun ne correspond.',
        inputs: { node: 'Le nœud dont on parcourt les enfants.' },
        parameters: {
            regex: 'Regex optionnelle sur le nom de la relation pour limiter les enfants parcourus.',
            filterProperty: 'Propriété du nœud sur laquelle filtrer (par défaut « name »).',
            regexFilter: 'Regex que la valeur de la propriété doit satisfaire pour sélectionner l\'enfant.',
        },
    },
    GET_NODE_PARENT: {
        label: 'Trouver un parent',
        description: 'Raccourci de GET_NODE_PARENTS + FIND_NODE : renvoie le premier parent du nœud dont une propriété correspond à une regex. « regex » limite les relations parcourues ; « filterProperty » (par défaut « name ») et « regexFilter » sélectionnent le parent. Lève une erreur si aucun ne correspond.',
        inputs: { node: 'Le nœud dont on parcourt les parents.' },
        parameters: {
            regex: 'Regex optionnelle sur le nom de la relation pour limiter les parents parcourus.',
            filterProperty: 'Propriété du nœud sur laquelle filtrer (par défaut « name »).',
            regexFilter: 'Regex que la valeur de la propriété doit satisfaire pour sélectionner le parent.',
        },
    },
    FILTER_NODE: {
        label: 'Filtrer des nœuds',
        description: 'Filtre des nœuds selon des critères donnés.',
        inputs: { nodes: 'Un nœud ou une liste de nœuds à filtrer.' },
        parameters: {
            filterProperty: 'Nom de la propriété d\'info (doit exister dans l\'info du nœud).',
            regexFilter: 'Motif regex de filtrage.',
        },
    },
    FIND_NODE: {
        label: 'Trouver un nœud',
        description: 'Renvoie le premier nœud correspondant aux critères donnés (comme FILTER_NODE mais renvoie un seul nœud).',
        inputs: { nodes: 'Un nœud ou une liste de nœuds à parcourir.' },
        parameters: {
            filterProperty: 'Nom de la propriété d\'info (doit exister dans l\'info du nœud).',
            regexFilter: 'Motif regex de filtrage.',
        },
    },
    ENDPOINT_NODE_CURRENT_VALUE: {
        label: 'Valeur courante d\'un endpoint',
        description: 'Pour un nœud représentant un endpoint, renvoie la valeur courante.',
        inputs: { endpoint: 'Le nœud endpoint dont on lit la valeur courante.' },
    },
    ENDPOINT_NODE_CURRENT_VALUE_MODEL: {
        label: 'Valeur courante d\'un endpoint (modèle)',
        description: 'Pour un nœud représentant un endpoint, renvoie le MODÈLE de la valeur courante (et non la valeur primitive), sur lequel on peut se lier. À utiliser pour alimenter un registre d\'entrée sur lequel un déclencheur COV peut se lier afin de réagir aux changements de valeur.',
        inputs: { endpoint: 'Le nœud endpoint dont on veut le modèle de valeur courante.' },
    },
    SET_ENDPOINT_VALUE: {
        label: 'Définir la valeur d\'un endpoint',
        description: 'Définit la valeur courante d\'un nœud endpoint. Prend 2 entrées : [nœud endpoint, valeur]. Renvoie la valeur affectée.',
        inputs: { endpoint: 'Le nœud endpoint à mettre à jour.', value: 'La valeur à affecter à l\'endpoint.' },
        parameters: { updateDirectModificationDate: UPDATE_DIRECT_MODIFICATION_DATE_FR },
    },
    SET_ENDPOINT_VALUE_PARAM: {
        label: 'Définir la valeur d\'un endpoint (constante)',
        description: 'Définit la valeur courante d\'un nœud endpoint à une valeur de paramètre statique. Prend 1 entrée : le nœud endpoint, et un paramètre « value ». Renvoie la valeur affectée.',
        inputs: { endpoint: 'Le nœud endpoint à mettre à jour.' },
        parameters: {
            value: 'La valeur à affecter (chaîne, nombre ou booléen).',
            updateDirectModificationDate: UPDATE_DIRECT_MODIFICATION_DATE_FR,
        },
    },
    // ── node attributes ──
    GET_ATTRIBUTE: {
        label: 'Lire un attribut',
        description: 'Renvoie la valeur d\'un attribut d\'un nœud, identifié par sa catégorie et son libellé.',
        inputs: { node: 'Le nœud dont on lit l\'attribut.' },
        parameters: { categoryName: 'Nom de la catégorie de l\'attribut.', label: 'Libellé de l\'attribut.' },
    },
    SET_ATTRIBUTE: {
        label: 'Définir un attribut',
        description: 'Définit un attribut sur un nœud par catégorie et libellé. Peut le créer ou seulement le mettre à jour selon le paramètre createIfNotExist.',
        inputs: { node: 'Le nœud sur lequel définir l\'attribut.', value: 'La valeur à affecter à l\'attribut.' },
        parameters: {
            categoryName: 'Nom de la catégorie de l\'attribut.',
            label: 'Libellé de l\'attribut.',
            createIfNotExist: 'Si vrai, crée l\'attribut s\'il n\'existe pas. Si faux, met seulement à jour les attributs existants (par défaut : vrai).',
            updateDirectModificationDate: UPDATE_DIRECT_MODIFICATION_DATE_FR,
        },
    },
    SET_ATTRIBUTE_PARAM: {
        label: 'Définir un attribut (constante)',
        description: 'Définit un attribut sur un nœud à partir d\'une valeur de paramètre statique. Peut le créer ou seulement le mettre à jour selon le paramètre createIfNotExist.',
        inputs: { node: 'Le nœud sur lequel définir l\'attribut.' },
        parameters: {
            categoryName: 'Nom de la catégorie de l\'attribut.',
            label: 'Libellé de l\'attribut.',
            value: 'La valeur à affecter.',
            createIfNotExist: 'Si vrai, crée l\'attribut s\'il n\'existe pas. Si faux, met seulement à jour les attributs existants (par défaut : vrai).',
            updateDirectModificationDate: UPDATE_DIRECT_MODIFICATION_DATE_FR,
        },
    },
    GET_ALL_ATTRIBUTES: {
        label: 'Lire tous les attributs',
        description: 'Renvoie tous les attributs d\'un nœud pour une catégorie donnée, sous forme de chaîne.',
        inputs: { node: 'Le nœud dont on veut les attributs.' },
        parameters: { categoryName: 'Nom de la catégorie d\'attributs.' },
    },
    GET_ATTRIBUTE_MODEL: {
        label: 'Lire un attribut (modèle)',
        description: 'Renvoie le modèle SpinalAttribute d\'un nœud par catégorie et libellé. Utile pour se lier à ses changements (onChange).',
        inputs: { node: 'Le nœud dont on lit le modèle d\'attribut.' },
        parameters: { categoryName: 'Nom de la catégorie de l\'attribut.', label: 'Libellé de l\'attribut.' },
    },
    GET_ALL_ATTRIBUTE_MODELS: {
        label: 'Lire tous les attributs (modèles)',
        description: 'Renvoie tous les modèles SpinalAttribute d\'un nœud pour une catégorie donnée. Utile pour se lier à leurs changements (onChange).',
        inputs: { node: 'Le nœud dont on veut les modèles d\'attributs.' },
        parameters: { categoryName: 'Nom de la catégorie d\'attributs.' },
    },
    // ── flow control ──
    DELAY: {
        label: 'Délai',
        description: 'Attend la durée indiquée puis renvoie son entrée inchangée. Utile pour cadencer un workflow, limiter le débit des appels, ou séquencer un bloc en aval pour qu\'il s\'exécute après un délai (le bloc en aval dépend de la sortie de ce bloc). La durée est plafonnée à 300000 ms pour ne pas bloquer le moteur.',
        inputs: { value: 'Une valeur quelconque ; renvoyée inchangée après le délai.' },
        parameters: { durationMs: 'Durée d\'attente avant de renvoyer, en millisecondes (plafonnée à 300000).' },
    },
    IF: {
        label: 'Si / Sinon',
        description: 'Bloc de branchement conditionnel. Prend un prédicat booléen en inputs[0] et une charge utile optionnelle en inputs[1]. Exécute thenWorkflow si vrai, elseWorkflow si faux. La charge utile est injectée comme $item dans la branche choisie. Géré par l\'exécuteur du DAG — ce run() n\'est jamais appelé directement.',
        inputs: {
            predicate: 'Booléen décidant quelle branche s\'exécute (then/else).',
            payload: 'Valeur optionnelle injectée comme $item dans la branche choisie.',
        },
    },
    LOG: {
        label: 'Journaliser',
        description: 'Écrit son entrée dans la console (toujours, indépendamment de ADVANCED_LOGGING) et la renvoie inchangée — une sonde transparente à insérer n\'importe où dans un workflow pour inspecter une valeur. Les chaînes sont écrites telles quelles ; les autres valeurs sont converties en texte (les objets en JSON). Un paramètre « prefix » optionnel étiquette la ligne pour savoir quel bloc LOG l\'a produite.',
        inputs: { value: 'La valeur à journaliser (typiquement une chaîne) ; renvoyée inchangée.' },
        parameters: { prefix: 'Étiquette optionnelle ajoutée en tête de la ligne (« [LOG] » par défaut).' },
    },
    // ── register / execution context ──
    CURRENT_NODE: {
        label: 'Nœud de travail courant',
        description: 'Renvoie le nœud de travail courant depuis le contexte d\'exécution. Utilisé comme bloc racine/source pour injecter le nœud de travail dans le DAG.',
    },
    GET_EXECUTION_REFERENCE_TIME: {
        label: 'Temps de référence de l\'exécution',
        description: 'Renvoie le temps de référence de l\'exécution (ms epoch) depuis le contexte d\'exécution. Utile pour des opérations de série temporelle (push/fetch) déterministes.',
    },
    GET_CURRENT_DATE: {
        label: 'Date actuelle',
        description: 'Renvoie la date et l\'heure actuelles (ms epoch).',
    },
    GET_EXECUTION_TRIGGER_TYPE: {
        label: 'Type de déclencheur',
        description: 'Renvoie le type de déclencheur ayant initié cette exécution (ex. INTERVAL_TIME, CRON, COV).',
    },
    GET_EXECUTION_TRIGGER_ID: {
        label: 'ID du déclencheur',
        description: 'Renvoie l\'identifiant optionnel du déclencheur (ex. Trigger1) ayant initié cette exécution.',
    },
    GET_EXECUTION_TRIGGER_INPUT_REGISTER: {
        label: 'Registre d\'entrée du déclencheur',
        description: 'Pour les exécutions COV, renvoie le nom du registre d\'entrée qui a été lié (ex. I0).',
    },
    GET_EXECUTION_TRIGGER_THRESHOLD: {
        label: 'Seuil du déclencheur',
        description: 'Pour les exécutions COV avec bande morte, renvoie la valeur du seuil.',
    },
    SET_INPUT_REGISTER: {
        label: 'Définir un registre d\'entrée',
        description: 'Transmet la valeur d\'entrée inchangée. L\'exécuteur du DAG utilise la propriété registerAs du bloc pour stocker cette valeur comme variable nommée (ex. I0, I1), réutilisable plus tard dans le workflow d\'exécution.',
        inputs: { value: 'La valeur à enregistrer sous le nom registerAs du bloc.' },
    },
    FETCH_INPUT_REGISTER: {
        label: 'Récupérer un registre d\'entrée',
        description: 'Récupère une variable d\'entrée nommée (ex. I0, I1) définie durant le workflow d\'entrée. Géré par l\'exécuteur du DAG — la fonction run() n\'est jamais appelée directement.',
        parameters: { registerName: 'Nom du registre à récupérer (ex. I0).' },
    },
    ELEMENT: {
        label: 'Élément',
        description: 'Bloc source des sous-workflows FOREACH. Injecte l\'élément courant du tableau. L\'exécuteur du DAG fournit la valeur — ce run() n\'est jamais appelé directement.',
    },
    FOREACH: {
        label: 'Pour chaque',
        description: 'Bloc d\'ordre supérieur qui prend un tableau en entrée et exécute un sous-workflow sur chaque élément. Les résultats sont rassemblés dans un tableau de sortie. Le sous-workflow doit contenir un bloc ELEMENT comme source d\'élément. Géré par l\'exécuteur du DAG — ce run() n\'est jamais appelé directement.',
        inputs: { items: 'Le tableau à parcourir.' },
    },
    // ── boolean ──
    GREATER_THAN: {
        label: 'Supérieur à',
        description: 'Renvoie vrai si le nombre en entrée est strictement supérieur au paramètre seuil.',
        inputs: { value: 'La valeur comparée au seuil.' },
        parameters: { threshold: 'La valeur du seuil.' },
    },
    LESS_THAN: {
        label: 'Inférieur à',
        description: 'Renvoie vrai si le nombre en entrée est strictement inférieur au paramètre seuil.',
        inputs: { value: 'La valeur comparée au seuil.' },
        parameters: { threshold: 'La valeur du seuil.' },
    },
    BETWEEN: {
        label: 'Entre',
        description: 'Renvoie vrai si le nombre en entrée est dans [min, max] (bornes incluses).',
        inputs: { value: 'La valeur testée par rapport à l\'intervalle [min, max].' },
        parameters: { min: 'Borne inférieure (incluse).', max: 'Borne supérieure (incluse).' },
    },
    NOT_BETWEEN: {
        label: 'Hors de',
        description: 'Renvoie vrai si le nombre en entrée est en dehors de [min, max] (hors de l\'intervalle).',
        inputs: { value: 'La valeur testée par rapport à l\'intervalle [min, max].' },
        parameters: { min: 'Borne inférieure.', max: 'Borne supérieure.' },
    },
    DIFFERENCE_THRESHOLD: {
        label: 'Écart dépassé',
        description: 'Prend deux nombres en entrée et renvoie vrai si l\'écart absolu dépasse le seuil.',
        inputs: { a: 'Première valeur.', b: 'Seconde valeur.' },
        parameters: { threshold: 'Écart absolu maximal autorisé.' },
    },
    AND: {
        label: 'ET',
        description: 'ET logique : renvoie vrai seulement si toutes les entrées booléennes sont vraies. Accepte un booléen unique ou un tableau de booléens.',
        inputs: { values: 'Un ou plusieurs booléens ; vrai seulement s\'ils sont tous vrais.' },
    },
    OR: {
        label: 'OU',
        description: 'OU logique : renvoie vrai si au moins une entrée booléenne est vraie. Accepte un booléen unique ou un tableau de booléens.',
        inputs: { values: 'Un ou plusieurs booléens ; vrai si au moins un est vrai.' },
    },
    NOT: {
        label: 'NON',
        description: 'NON logique : inverse un booléen en entrée.',
        inputs: { value: 'Le booléen à inverser.' },
    },
    // ── conversion ──
    PARSE_NUMBER: {
        label: 'Convertir en nombre',
        description: 'Analyse un nombre à partir d\'une chaîne en entrée. Lève une erreur si la chaîne ne peut pas être convertie en nombre valide.',
        inputs: { value: 'La chaîne à convertir en nombre.' },
    },
    BOOLEAN_TO_NUMBER: {
        label: 'Booléen vers nombre',
        description: 'Convertit un booléen en nombre : vrai → 1, faux → 0.',
        inputs: { value: 'Le booléen à convertir.' },
    },
    NUMBER_TO_BOOLEAN: {
        label: 'Nombre vers booléen',
        description: 'Convertit un nombre en booléen : 0 → faux, toute autre valeur → vrai.',
        inputs: { value: 'Le nombre à convertir.' },
    },
    // ── object ──
    CREATE_OBJECT: {
        label: 'Créer un objet',
        description: 'Crée un nouvel objet à partir d\'un paramètre chaîne JSON, ou un objet vide si aucun n\'est fourni.',
        parameters: { json: 'Chaîne JSON optionnelle pour initialiser l\'objet.' },
    },
    GET_PROPERTY: {
        label: 'Lire une propriété',
        description: 'Récupère la valeur d\'une propriété d\'un objet JSON (chaîne) par clé. Gère l\'accès imbriqué avec la notation par points (ex. « a.b.c »).',
        inputs: { object: 'L\'objet JSON (chaîne JSON) sur lequel opérer.' },
        parameters: { key: 'La clé de la propriété (notation par points pour l\'accès imbriqué).' },
    },
    SET_PROPERTY: {
        label: 'Définir une propriété',
        description: 'Définit une propriété sur un objet JSON (chaîne). Prend l\'objet en entrée sous forme de chaîne JSON. Gère les clés imbriquées avec la notation par points.',
        inputs: { object: 'L\'objet JSON (chaîne JSON) sur lequel opérer.' },
        parameters: {
            key: 'La clé de la propriété (notation par points pour l\'accès imbriqué).',
            value: 'La valeur à affecter (analysée en JSON si possible).',
        },
    },
    SET_PROPERTY_DYNAMIC: {
        label: 'Définir une propriété (dynamique)',
        description: 'Définit une propriété sur un objet JSON (chaîne) à partir d\'une valeur d\'entrée dynamique. Prend 2 entrées : [chaîne JSON, valeur].',
        inputs: { object: 'L\'objet JSON (chaîne JSON).', value: 'La valeur à affecter à la propriété.' },
        parameters: { key: 'La clé de la propriété (notation par points).' },
    },
    DELETE_PROPERTY: {
        label: 'Supprimer une propriété',
        description: 'Supprime une propriété d\'un objet JSON (chaîne) par clé. Gère la notation par points.',
        inputs: { object: 'L\'objet JSON (chaîne JSON) sur lequel opérer.' },
        parameters: { key: 'La clé de la propriété à supprimer (notation par points).' },
    },
    MERGE_OBJECTS: {
        label: 'Fusionner des objets',
        description: 'Fusionne deux objets JSON (chaînes) en un seul (fusion superficielle, le second écrase le premier). Prend 2 entrées : [obj1, obj2].',
        inputs: {
            object1: 'Le premier objet JSON (chaîne JSON).',
            object2: 'Le second objet JSON (chaîne JSON) ; ses clés écrasent celles du premier.',
        },
    },
    HAS_PROPERTY: {
        label: 'Contient une propriété',
        description: 'Vérifie si une propriété existe dans un objet JSON (chaîne). Renvoie vrai/faux.',
        inputs: { object: 'L\'objet JSON (chaîne JSON) sur lequel opérer.' },
        parameters: { key: 'La clé de la propriété à vérifier (notation par points).' },
    },
    GET_KEYS: {
        label: 'Clés de l\'objet',
        description: 'Renvoie les clés d\'un objet JSON sous forme de tableau JSON (chaîne).',
        inputs: { object: 'L\'objet JSON (chaîne JSON) sur lequel opérer.' },
    },
    // ── list ──
    CREATE_LIST: {
        label: 'Créer une liste',
        description: 'Crée un nouveau tableau JSON à partir d\'un paramètre chaîne JSON optionnel, ou un tableau vide si aucun n\'est fourni.',
        parameters: { json: 'Chaîne de tableau JSON optionnelle pour initialiser la liste.' },
    },
    LIST_PUSH: {
        label: 'Ajouter en fin de liste',
        description: 'Ajoute une valeur à la fin d\'un tableau JSON. Prend 2 entrées : [tableau JSON, valeur].',
        inputs: { list: 'Le tableau JSON (chaîne JSON).', value: 'La valeur à ajouter.' },
    },
    LIST_PUSH_PARAM: {
        label: 'Ajouter en fin de liste (constante)',
        description: 'Ajoute une valeur de paramètre statique à la fin d\'un tableau JSON.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
        parameters: { value: 'La valeur à ajouter (analysée en JSON si possible).' },
    },
    LIST_POP: {
        label: 'Retirer en fin de liste',
        description: 'Retire et renvoie le dernier élément d\'un tableau JSON. Renvoie le tableau modifié.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
    },
    LIST_SHIFT: {
        label: 'Retirer en début de liste',
        description: 'Retire et renvoie le premier élément d\'un tableau JSON. Renvoie le tableau modifié.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
    },
    LIST_UNSHIFT: {
        label: 'Ajouter en début de liste',
        description: 'Ajoute une valeur au début d\'un tableau JSON. Prend 2 entrées : [tableau JSON, valeur].',
        inputs: { list: 'Le tableau JSON (chaîne JSON).', value: 'La valeur à ajouter.' },
    },
    LIST_CONCAT: {
        label: 'Concaténer des listes',
        description: 'Concatène deux tableaux JSON. Prend 2 entrées : [tableau1, tableau2].',
        inputs: { list1: 'Le premier tableau JSON (chaîne JSON).', list2: 'Le second tableau JSON (chaîne JSON).' },
    },
    LIST_GET: {
        label: 'Élément de la liste',
        description: 'Récupère l\'élément à un indice donné d\'un tableau JSON.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
        parameters: { index: 'L\'indice de l\'élément à récupérer (indices négatifs pris en charge).' },
    },
    LIST_LENGTH: {
        label: 'Taille de la liste',
        description: 'Renvoie la taille d\'un tableau JSON.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
    },
    LIST_INCLUDES: {
        label: 'La liste contient',
        description: 'Vérifie si un tableau JSON contient une valeur donnée.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
        parameters: { value: 'La valeur à rechercher (analysée en JSON si possible).' },
    },
    LIST_INDEX_OF: {
        label: 'Indice dans la liste',
        description: 'Renvoie le premier indice d\'une valeur dans un tableau JSON, ou -1 si absente.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
        parameters: { value: 'La valeur à rechercher (analysée en JSON si possible).' },
    },
    LIST_SLICE: {
        label: 'Extraire une portion de liste',
        description: 'Renvoie une portion (slice) d\'un tableau JSON.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
        parameters: {
            start: 'Indice de début (inclus, indices négatifs pris en charge).',
            end: 'Indice de fin (exclu, indices négatifs pris en charge).',
        },
    },
    LIST_REVERSE: {
        label: 'Inverser la liste',
        description: 'Inverse un tableau JSON.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
    },
    LIST_FLATTEN: {
        label: 'Aplatir la liste',
        description: 'Aplatit un tableau JSON imbriqué d\'un niveau.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
    },
    LIST_UNIQUE: {
        label: 'Dédupliquer la liste',
        description: 'Supprime les valeurs primitives en double d\'un tableau JSON.',
        inputs: { list: 'Le tableau JSON (chaîne JSON) sur lequel opérer.' },
    },
    // ── timeseries ──
    GET_ENDPOINT_TIMESERIES: {
        label: 'Série temporelle d\'un endpoint',
        description: 'Récupère la série temporelle d\'un nœud BmsEndpoint sous forme d\'un tableau de points { date, value } (date en ms epoch, value numérique), triés par date. La fenêtre peut être donnée en plage absolue (start/end) ou relative au temps de référence de l\'exécution (windowMs/lastHours/lastDays en arrière depuis « end »). includeValueAtBegin / extendToEnd complètent la valeur aux bornes de la fenêtre pour qu\'un calcul en aval (ex. TIMESERIES_TIME_WEIGHTED_AVERAGE) couvre toute la fenêtre. Renvoie un tableau vide si l\'endpoint n\'a pas de série.',
        inputs: { endpoint: 'Le nœud BmsEndpoint dont on récupère la série.' },
        parameters: {
            start: 'Début absolu de la fenêtre, ms epoch ou date lisible. Prioritaire sur les paramètres de fenêtre relatifs. Par défaut : le début des données (0).',
            end: 'Fin absolue de la fenêtre, ms epoch ou date lisible. Par défaut : le temps de référence de l\'exécution (ou maintenant si indisponible).',
            windowMs: 'Durée de la fenêtre en millisecondes, comptée en arrière depuis « end ». Ignoré si « start » est défini.',
            lastHours: 'Durée de la fenêtre en heures, comptée en arrière depuis « end ». Ignoré si « start » ou « windowMs » est défini.',
            lastDays: 'Durée de la fenêtre en jours, comptée en arrière depuis « end ». Ignoré si « start », « windowMs » ou « lastHours » est défini.',
            includeValueAtBegin: 'Si vrai, inclut la dernière valeur enregistrée avant « start » pour que la série ait une valeur à l\'ouverture de la fenêtre. Faux par défaut.',
            extendToEnd: 'Si vrai, ajoute un point à « end » reprenant la dernière valeur enregistrée, pour prolonger la dernière mesure jusqu\'à la fermeture de la fenêtre. Symétrique à includeValueAtBegin (qui amorce l\'ouverture) ; ensemble ils font couvrir toute la fenêtre à la série, rendant un TIMESERIES_TIME_WEIGHTED_AVERAGE en aval correct sur la fenêtre. Faux par défaut.',
        },
    },
    TIMESERIES_FIRST: {
        label: 'Première valeur (série)',
        description: 'Renvoie la valeur du premier point (le plus ancien) d\'une série ({ date, value }[]). Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni.',
        inputs: { series: 'La série temporelle ({ date, value }[]) à réduire.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_LAST: {
        label: 'Dernière valeur (série)',
        description: 'Renvoie la valeur du dernier point (le plus récent) d\'une série ({ date, value }[]). Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni.',
        inputs: { series: 'La série temporelle ({ date, value }[]) à réduire.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_DELTA: {
        label: 'Delta (série)',
        description: 'Renvoie la différence entre la dernière et la première valeur d\'une série (dernière − première). Pour un compteur cumulatif récupéré sur une fenêtre, c\'est la consommation sur cette fenêtre. À combiner avec includeValueAtBegin=true de GET_ENDPOINT_TIMESERIES pour utiliser la valeur de départ de la fenêtre comme « première ». Un point unique donne 0. Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni (ex. 0 pour un endpoint défaillant qui ne doit rien apporter à une somme).',
        inputs: { series: 'La série temporelle ({ date, value }[]) à réduire.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_TIME_WEIGHTED_AVERAGE: {
        label: 'Moyenne temporelle pondérée',
        description: 'Calcule la moyenne temporelle pondérée d\'une série ({ date, value }[]) avec maintien d\'ordre zéro : chaque valeur est pondérée par la durée jusqu\'au point suivant (modèle en escalier, adapté aux mesures de capteurs), sur l\'étendue [premier point, dernier point]. Pour la rendre correcte sur la fenêtre, façonnez la série à la récupération avec includeValueAtBegin=true (une valeur à l\'ouverture) et extendToEnd=true (la dernière valeur portée jusqu\'à la fermeture) — l\'étendue devient alors la fenêtre. Un point unique — ou une série sans étendue temporelle — donne la moyenne simple des valeurs. Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni.',
        inputs: { series: 'La série temporelle ({ date, value }[]) à moyenner.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_MIN: {
        label: 'Minimum (série)',
        description: 'Renvoie la valeur minimale d\'une série ({ date, value }[]). Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni.',
        inputs: { series: 'La série temporelle ({ date, value }[]) à réduire.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_MAX: {
        label: 'Maximum (série)',
        description: 'Renvoie la valeur maximale d\'une série ({ date, value }[]). Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni.',
        inputs: { series: 'La série temporelle ({ date, value }[]) à réduire.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_AVERAGE: {
        label: 'Moyenne (série)',
        description: 'Renvoie la moyenne arithmétique simple des valeurs d\'une série ({ date, value }[]) — chaque point compte également, quel que soit l\'espacement. Pour une moyenne tenant compte du temps entre mesures (adaptée aux données de capteurs irrégulières), utilisez TIMESERIES_TIME_WEIGHTED_AVERAGE. Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni.',
        inputs: { series: 'La série temporelle ({ date, value }[]) à moyenner.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_SUM: {
        label: 'Somme (série)',
        description: 'Renvoie la somme des valeurs d\'une série ({ date, value }[]). Lève une erreur si la série est vide, sauf si defaultOnEmpty est fourni (ex. 0).',
        inputs: { series: 'La série temporelle ({ date, value }[]) à sommer.' },
        parameters: { defaultOnEmpty: 'Valeur renvoyée si la série est vide (ex. un endpoint défaillant sans données, afin qu\'il contribue cette valeur à une somme en aval). Si absent, le bloc lève une erreur.' },
    },
    TIMESERIES_COUNT: {
        label: 'Nombre de points (série)',
        description: 'Renvoie le nombre de points d\'une série ({ date, value }[]). Renvoie 0 pour une série vide — un compte est toujours défini, donc ne lève jamais d\'erreur.',
        inputs: { series: 'La série temporelle ({ date, value }[]) à compter.' },
    },
    PUSH_ENDPOINT_VALUE: {
        label: 'Pousser une valeur sur un endpoint',
        description: 'Enregistre une valeur sur un endpoint : met à jour la currentValue de l\'élément du nœud (comme SET_ENDPOINT_VALUE) ET ajoute un point à la série temporelle de l\'endpoint (créant la série si elle n\'existe pas encore). Prend 2 entrées : [nœud endpoint, valeur]. Le point est daté au temps de référence de l\'exécution par défaut, ou au paramètre « date » optionnel. Renvoie la valeur enregistrée.',
        inputs: {
            endpoint: 'Le nœud endpoint sur lequel enregistrer la valeur.',
            value: 'La valeur à définir comme currentValue et à ajouter à la série temporelle.',
        },
        parameters: {
            date: 'Horodatage du point de série, ms epoch ou date lisible. Par défaut : le temps de référence de l\'exécution (ou maintenant si indisponible).',
            updateDirectModificationDate: UPDATE_DIRECT_MODIFICATION_DATE_FR,
        },
    },
    // ── http ──
    CURL_REQUEST: {
        label: 'Requête cURL',
        description: 'Analyse une commande curl et effectue la requête HTTP, renvoyant le corps de la réponse sous forme de chaîne (les réponses JSON sont sérialisées afin d\'être passées à GET_PROPERTY / PARSE_NUMBER). La commande curl provient de l\'entrée câblée si présente, sinon du paramètre « curl ». Prend en charge -X, -H, -d/--data*, --json, -u, -G, -b, -A, -e. Lève une erreur sur les erreurs réseau et les réponses non-2xx (le statut et le corps sont inclus dans l\'erreur).',
        inputs: { curl: 'Commande curl optionnelle. Remplace le paramètre « curl » lorsqu\'elle est câblée (ex. un modèle de curl stocké sur un nœud).' },
        parameters: {
            curl: 'La commande curl à analyser et exécuter (utilisée quand aucune entrée curl n\'est câblée).',
            timeoutMs: 'Délai d\'expiration de la requête en millisecondes (30000 par défaut).',
        },
    },
    // ── string ──
    FORMAT_STRING: {
        label: 'Formater une chaîne',
        description: 'Construit une chaîne à partir d\'un modèle en substituant les repères positionnels {0}, {1}, … par les entrées câblées, dans l\'ordre (input[0] → {0}, input[1] → {1}, …). Les chaînes sont insérées telles quelles, les objets/tableaux en JSON, les autres valeurs via String(). Pratique pour construire des commandes curl, des URL, des corps de requête ou des messages dynamiques (ex. injecter un jeton d\'authentification dans une requête). Seuls {chiffres} sont des repères ; les accolades JSON comme {"k":"v"} sont conservées.',
        inputs: { values: 'Valeurs à substituer à {0}, {1}, … dans l\'ordre du modèle.' },
        parameters: { template: 'Le modèle avec des repères positionnels, ex. « Bearer {0} ».' },
    },
    // ── ticket ──
    CREATE_TICKET: {
        label: 'Créer un ticket',
        description: 'Crée un ticket rattaché au nœud en entrée, sous un contexte de tickets (alias workflow) → processus (alias domaine) résolus par nom via les paramètres. Le ticket est placé automatiquement dans la première étape du processus. Renvoie le nœud du ticket créé (chaînable vers MOVE_TICKET_TO_NEXT_STEP). La résolution est par nom — le premier contexte correspondant, puis le premier processus correspondant à l\'intérieur, sont utilisés.',
        inputs: { node: 'Le nœud auquel le ticket est rattaché (ex. le nœud de travail / équipement / pièce concerné).' },
        parameters: {
            contextName: 'Nom du contexte de tickets (alias workflow) auquel appartient le ticket.',
            processName: 'Nom du processus (alias domaine) dans le contexte. Le ticket est créé dans sa première étape.',
            name: 'Le nom / titre du ticket.',
            priority: 'Priorité optionnelle du ticket.',
            ticketType: 'Type de ticket optionnel — « Ticket » (par défaut) ou « Alarm ».',
        },
    },
    GET_TICKETS_FROM_NODE: {
        label: 'Tickets d\'un nœud',
        description: 'Renvoie les nœuds tickets rattachés au nœud en entrée sous forme d\'un tableau de SpinalNode (vide s\'il n\'y en a pas). Utile pour éviter les doublons — ex. ne créer un ticket que si cette liste est vide. Se compose avec les blocs de nœuds (FIRST_NODE, FILTER_NODE, GET_ATTRIBUTE, …) ; alimentez un nœud ticket à MOVE_TICKET_TO_NEXT_STEP.',
        inputs: { node: 'Le nœud dont on liste les tickets rattachés.' },
    },
    MOVE_TICKET_TO_NEXT_STEP: {
        label: 'Passer le ticket à l\'étape suivante',
        description: 'Fait avancer un ticket à l\'étape suivante de son processus. Prend le NŒUD du ticket en entrée (ex. un élément de GET_TICKETS_FROM_NODE). Le contexte (workflow) est résolu par nom via le paramètre ; le processus est déduit du ticket. Renvoie le nœud du ticket (inchangé) pour le chaînage. Aucune action si le ticket est déjà à la dernière étape.',
        inputs: { ticket: 'Le nœud ticket à faire avancer (le type doit être « SpinalSystemServiceTicketTypeTicket »).' },
        parameters: { contextName: 'Nom du contexte de tickets (alias workflow) auquel appartient le ticket.' },
    },
};
//# sourceMappingURL=fr.js.map