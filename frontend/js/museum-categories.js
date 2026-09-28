/**
 * Museum Category Classification System
 * Authoritative 1-to-1 mapping for all 89 museums in the database.
 * 
 * Categories:
 * - 'art-culture': Art & Culture
 * - 'history-heritage': History & Heritage
 * - 'science-technology': Science & Technology
 * - 'archaeology': Archaeology
 */

const MUSEUM_CATEGORIES = {
    "1": "art-culture",
    "2": "science-technology",
    "3": "art-culture",
    "4": "art-culture",
    "5": "history-heritage",
    "6": "art-culture",
    "7": "history-heritage",
    "8": "archaeology",
    "9": "history-heritage",
    "10": "science-technology",
    "11": "history-heritage",
    "12": "history-heritage",
    "13": "science-technology",
    "14": "history-heritage",
    "15": "art-culture",
    "16": "science-technology",
    "17": "archaeology",
    "18": "science-technology",
    "19": "art-culture",
    "20": "history-heritage",
    "21": "archaeology",
    "22": "art-culture",
    "23": "science-technology",
    "24": "art-culture",
    "25": "history-heritage",
    "26": "archaeology",
    "27": "history-heritage",
    "28": "archaeology",
    "29": "archaeology",
    "30": "history-heritage",
    "31": "archaeology",
    "32": "art-culture",
    "33": "art-culture",
    "34": "history-heritage",
    "35": "art-culture",
    "36": "science-technology",
    "37": "archaeology",
    "38": "history-heritage",
    "39": "archaeology",
    "40": "archaeology",
    "41": "art-culture",
    "42": "archaeology",
    "43": "science-technology",
    "44": "history-heritage",
    "45": "history-heritage",
    "46": "art-culture",
    "47": "science-technology",
    "48": "art-culture",
    "49": "archaeology",
    "50": "art-culture",
    "51": "art-culture",
    "52": "archaeology",
    "53": "history-heritage",
    "54": "history-heritage",
    "55": "art-culture",
    "56": "art-culture",
    "57": "science-technology",
    "58": "history-heritage",
    "59": "history-heritage",
    "60": "art-culture",
    "61": "art-culture",
    "62": "history-heritage",
    "63": "history-heritage",
    "64": "art-culture",
    "65": "archaeology",
    "66": "art-culture",
    "67": "science-technology",
    "68": "art-culture",
    "69": "art-culture",
    "70": "history-heritage",
    "71": "history-heritage",
    "72": "art-culture",
    "73": "history-heritage",
    "74": "art-culture",
    "75": "history-heritage",
    "76": "history-heritage",
    "77": "history-heritage",
    "78": "art-culture",
    "79": "archaeology",
    "80": "art-culture",
    "81": "archaeology",
    "82": "history-heritage",
    "83": "history-heritage",
    "84": "archaeology",
    "85": "archaeology",
    "86": "art-culture",
    "87": "history-heritage",
    "88": "history-heritage",
    "89": "history-heritage"
};

const CATEGORY_DEFINITIONS = [
    {
        id: 'all',
        name: 'All Museums',
        shortName: 'All',
        icon: 'fas fa-th-large',
        color: '#2962ff',
        description: 'Browse the complete verified collection across all categories and states.'
    },
    {
        id: 'art-culture',
        name: 'Art & Culture',
        shortName: 'Art & Culture',
        icon: 'fas fa-palette',
        color: '#ea580c',
        description: 'Discover timeless paintings, classical sculptures, textiles, and rich traditional crafts.'
    },
    {
        id: 'history-heritage',
        name: 'History & Heritage',
        shortName: 'History & Heritage',
        icon: 'fas fa-landmark',
        color: '#db2777',
        description: 'Explore royal palaces, imperial regalia, weaponry, numismatics, and Indian freedom history.'
    },
    {
        id: 'science-technology',
        name: 'Science & Technology',
        shortName: 'Science & Tech',
        icon: 'fas fa-flask',
        color: '#2563eb',
        description: 'Interactive science galleries, space exploration, aviation, and technological innovation.'
    },
    {
        id: 'archaeology',
        name: 'Archaeology',
        shortName: 'Archaeology',
        icon: 'fas fa-archway',
        color: '#059669',
        description: 'Excavated antiquities, Harappan relics, ancient inscriptions, and archaeological site treasures.'
    }
];

function getCategoryCount(categoryId, museumList) {
    if (!categoryId || categoryId === 'all') {
        return museumList ? museumList.length : 89;
    }
    const list = museumList || Object.keys(MUSEUM_CATEGORIES).map(id => ({ id: parseInt(id, 10) }));
    return list.filter(m => MUSEUM_CATEGORIES[m.id] === categoryId).length;
}

if (typeof window !== 'undefined') {
    window.MUSEUM_CATEGORIES = MUSEUM_CATEGORIES;
    window.CATEGORY_DEFINITIONS = CATEGORY_DEFINITIONS;
    window.getCategoryCount = getCategoryCount;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MUSEUM_CATEGORIES,
        CATEGORY_DEFINITIONS,
        getCategoryCount
    };
}
