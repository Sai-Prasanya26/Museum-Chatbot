const MuseumModel = require('../models/museumModel');
const BookingModel = require('../models/bookingModel');

class ChatbotService {
    static async processMessage(message, userId = null) {
        if (!message || typeof message !== 'string') {
            return {
                text: "Hello! I am QBot, your Museum Assistant. You can ask me about museums across India, ticket prices, timings, collections, and your bookings.",
                suggestions: ["Browse Museums", "Check Ticket Prices", "Operating Hours", "Collections"]
            };
        }

        const msg = message.trim();
        const lower = msg.toLowerCase();

        // 1. GREETINGS
        if (/^(hi|hello|hey|greetings|namaste|good\s*(morning|afternoon|evening))/i.test(lower)) {
            return {
                text: "👋 Namaste! I am QBot, your Museum & Heritage Guide. How can I assist your cultural journey today?",
                suggestions: [
                    "Museums in Telangana",
                    "Ticket price of Salar Jung Museum",
                    "Museums in Delhi",
                    "Explore Collections",
                    "My Bookings"
                ]
            };
        }

        // 2. USER'S OWN BOOKINGS
        if (lower.includes('my booking') || lower.includes('my ticket') || lower.includes('show my booking') || lower.includes('check my booking')) {
            if (!userId) {
                return {
                    text: "🔐 To view your personal bookings, please log in with your account first.",
                    suggestions: ["Log In", "Browse Museums"]
                };
            }

            const bookings = await BookingModel.getByUserId(userId);
            if (!bookings || bookings.length === 0) {
                return {
                    text: "You don't have any bookings yet. Would you like to explore popular museums and book your first visit?",
                    suggestions: ["Browse Museums", "Taj Mahal", "Salar Jung Museum"]
                };
            }

            const activeBookings = bookings.filter(b => b.booking_status === 'CONFIRMED');
            let responseText = `You have ${bookings.length} booking(s) on record (${activeBookings.length} confirmed):\n\n`;

            bookings.slice(0, 3).forEach((b, i) => {
                const dateStr = new Date(b.visit_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
                responseText += `${i + 1}. ${b.museum_name} (${b.museum_city})\n`;
                responseText += `   Ref: ${b.booking_reference} | Date: ${dateStr}\n`;
                responseText += `   Visitors: ${b.adult_count} Adults, ${b.child_count} Children | Total: ₹${b.total_price}\n`;
                responseText += `   Status: ${b.booking_status}\n\n`;
            });

            if (bookings.length > 3) {
                responseText += `Visit your 'My Bookings' page to view all ${bookings.length} reservations.`;
            }

            return {
                text: responseText,
                intent: 'user_bookings',
                data: bookings,
                suggestions: ["My Bookings Page", "Book Another Ticket"]
            };
        }

        // 3. CANCELLATION HELP
        if (lower.includes('cancel') || lower.includes('refund')) {
            return {
                text: "To cancel a booking:\n1. Log in and go to the 'My Bookings' page from the top menu.\n2. Locate the booking you wish to cancel.\n3. Click the 'Cancel Booking' button and confirm.\n\nYour booking status will immediately update to CANCELLED and your payment status will be marked as REFUNDED.",
                suggestions: ["My Bookings", "Booking Rules"]
            };
        }

        // 4. SEARCH FOR SPECIFIC MUSEUM IN DATABASE
        const allMuseums = await MuseumModel.getAll();

        // Check if message references a specific museum
        let matchedMuseum = null;
        for (const m of allMuseums) {
            const mName = m.name.toLowerCase();
            if (lower.includes(mName)) {
                matchedMuseum = m;
                break;
            }
        }

        // Secondary partial match if not exact match (e.g. "salar jung", "charminar", "taj mahal", "konark", "unity")
        if (!matchedMuseum) {
            const keywords = ['salar jung', 'charminar', 'taj mahal', 'golconda', 'hawa mahal', 'khajuraho', 'konark', 'qutub minar', 'statue of unity', 'chhatrapati shivaji', 'nehru science', 'indian museum', 'victoria memorial', 'national museum'];
            for (const kw of keywords) {
                if (lower.includes(kw)) {
                    matchedMuseum = allMuseums.find(m => m.name.toLowerCase().includes(kw));
                    if (matchedMuseum) break;
                }
            }
        }

        // Handle specific museum queries
        if (matchedMuseum) {
            const isPriceQuery = lower.includes('price') || lower.includes('ticket') || lower.includes('cost') || lower.includes('fee') || lower.includes('how much') || lower.includes('rate');
            const isTimingQuery = lower.includes('timing') || lower.includes('time') || lower.includes('hour') || lower.includes('open') || lower.includes('close');
            const isLocationQuery = lower.includes('where') || lower.includes('location') || lower.includes('address') || lower.includes('city') || lower.includes('state');
            const isBookingQuery = lower.includes('book');

            if (isPriceQuery) {
                return {
                    text: `💰 Ticket Prices for **${matchedMuseum.name}** (${matchedMuseum.city}, ${matchedMuseum.state}):\n\n` +
                          `• Adult (Ages 13–59): ₹${matchedMuseum.adult_price}\n` +
                          `• Child (Ages 5–12): ₹${matchedMuseum.child_price}\n` +
                          `• Senior (Ages 60+): ₹${matchedMuseum.senior_price}\n` +
                          `• Children under 5 enter free!\n\n` +
                          `Would you like to book tickets for ${matchedMuseum.name}?`,
                    intent: 'museum_pricing',
                    museum: matchedMuseum,
                    suggestions: [`Book ${matchedMuseum.name}`, `Timings of ${matchedMuseum.name}`, "Other Museums"]
                };
            }

            if (isTimingQuery) {
                return {
                    text: `⏰ Operating Hours for **${matchedMuseum.name}**:\n\n` +
                          `• Opening Time: ${matchedMuseum.opening_time}\n` +
                          `• Closing Time: ${matchedMuseum.closing_time}\n` +
                          `• Schedule: Open Tuesday through Sunday (Closed Mondays and National Holidays)\n` +
                          `• Last entry is allowed 30 minutes before closing.`,
                    intent: 'museum_timings',
                    museum: matchedMuseum,
                    suggestions: [`Ticket Price of ${matchedMuseum.name}`, `Book ${matchedMuseum.name}`, "Check Location"]
                };
            }

            if (isLocationQuery) {
                return {
                    text: `📍 **${matchedMuseum.name}** is located in **${matchedMuseum.city}, ${matchedMuseum.state}**.\n\n` +
                          `${matchedMuseum.description ? matchedMuseum.description.slice(0, 180) + '...' : ''}`,
                    intent: 'museum_location',
                    museum: matchedMuseum,
                    suggestions: [`View ${matchedMuseum.name}`, `Book Tickets`, "Museums in " + matchedMuseum.state]
                };
            }

            // General Museum Overview
            return {
                text: `🏛️ **${matchedMuseum.name}** (${matchedMuseum.city}, ${matchedMuseum.state})\n\n` +
                      `${matchedMuseum.description || 'A historic landmark and museum featuring cultural exhibits.'}\n\n` +
                      `⏰ Hours: ${matchedMuseum.opening_time} - ${matchedMuseum.closing_time}\n` +
                      `💰 Tickets: Adult ₹${matchedMuseum.adult_price} | Child ₹${matchedMuseum.child_price} | Senior ₹${matchedMuseum.senior_price}`,
                intent: 'museum_details',
                museum: matchedMuseum,
                suggestions: [`Book ${matchedMuseum.name}`, `Ticket Prices`, "View Details"]
            };
        }

        // 5. SEARCH BY STATE OR CITY
        const states = await MuseumModel.getDistinctStates();
        let matchedState = null;
        for (const st of states) {
            if (lower.includes(st.toLowerCase())) {
                matchedState = st;
                break;
            }
        }

        if (matchedState) {
            const stateMuseums = await MuseumModel.getByState(matchedState);
            let responseText = `Here are museums in **${matchedState}** (${stateMuseums.length} available):\n\n`;
            stateMuseums.slice(0, 6).forEach((m, idx) => {
                responseText += `${idx + 1}. **${m.name}** (${m.city})\n   Adult: ₹${m.adult_price} | Child: ₹${m.child_price}\n`;
            });

            if (stateMuseums.length > 6) {
                responseText += `\n...and ${stateMuseums.length - 6} more in ${matchedState}.`;
            }

            return {
                text: responseText,
                intent: 'museums_by_state',
                data: stateMuseums,
                suggestions: stateMuseums.slice(0, 3).map(m => `Book ${m.name}`)
            };
        }

        // Check for common cities
        const cityKeywords = ['hyderabad', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'jaipur', 'agra', 'bhopal', 'pune', 'ahmedabad'];
        let matchedCity = null;
        for (const ck of cityKeywords) {
            if (lower.includes(ck)) {
                matchedCity = ck;
                break;
            }
        }

        if (matchedCity) {
            const cityMuseums = await MuseumModel.search(matchedCity);
            if (cityMuseums.length > 0) {
                let responseText = `Here are museums available in/around **${matchedCity.toUpperCase()}**:\n\n`;
                cityMuseums.slice(0, 5).forEach((m, idx) => {
                    responseText += `${idx + 1}. **${m.name}** (${m.state}) — Adult: ₹${m.adult_price}\n`;
                });
                return {
                    text: responseText,
                    intent: 'museums_by_city',
                    data: cityMuseums,
                    suggestions: cityMuseums.slice(0, 3).map(m => m.name)
                };
            }
        }

        // 6. GENERAL INFORMATION & FAQS
        if (lower.includes('wheelchair') || lower.includes('accessible') || lower.includes('disability')) {
            return {
                text: "♿ **Accessibility Information:**\nAll major national museums and monuments provide ramp access, elevators, and complimentary wheelchairs at the information desk. Specially-abled visitors also receive priority entry assistance.",
                suggestions: ["Browse Museums", "Guided Tours"]
            };
        }

        if (lower.includes('photo') || lower.includes('camera') || lower.includes('video')) {
            return {
                text: "📷 **Photography Policy:**\nPersonal handheld photography (without flash) is permitted in most galleries. Tripods, commercial videography, and photography in restricted conservation areas require prior written permission.",
                suggestions: ["Check Timings", "Ticket Prices"]
            };
        }

        if (lower.includes('tour') || lower.includes('guide') || lower.includes('audio')) {
            return {
                text: "🎧 **Guided Tours & Audio Guides:**\nDaily guided tours are conducted at 10:00 AM, 02:00 PM, and 04:00 PM in Hindi, English, and local languages. Multilingual audio guide devices can be rented at the visitor center for ₹50–₹100.",
                suggestions: ["Browse Museums", "Book Tickets"]
            };
        }

        if (lower.includes('food') || lower.includes('cafe') || lower.includes('cafeteria') || lower.includes('restaurant')) {
            return {
                text: "☕ **Dining & Cafeteria:**\nMost premier museums feature cafeterias serving refreshments, tea, coffee, and regional meals. Outside food is typically not permitted inside exhibition galleries.",
                suggestions: ["Museum Timings", "Browse Museums"]
            };
        }

        // 7. COLLECTIONS EXPLORER
        if (lower.includes('collection') || lower.includes('exhibit') || lower.includes('artifact') || lower.includes('art')) {
            return {
                text: "🏛️ **Explore Museum Collections Across India:**\n\n" +
                      "1. 🏺 **Ancient History**: Harappan pottery, Buddhist sculptures, Chola bronzes, medieval royal armor.\n" +
                      "2. 🎨 **Fine Arts & Paintings**: Mughal & Rajput miniatures, modern Indian contemporary art, Tanjore paintings.\n" +
                      "3. 🦕 **Natural History & Science**: Prehistoric fossils, mineral exhibits, astronomy planetariums, interactive science halls.\n" +
                      "4. ✨ **Special Exhibitions**: Rotating seasonal galleries and international art showcases.\n\n" +
                      "Which subject interests you most?",
                suggestions: ["Ancient History", "Fine Arts", "Natural History", "Browse Museums"]
            };
        }

        // 8. HOW TO BOOK
        if (lower.includes('how to book') || lower.includes('booking process') || (lower.includes('book') && !matchedMuseum)) {
            return {
                text: "🎟️ **Booking a Museum Ticket is Simple:**\n\n" +
                      "1. Click **Museums** in the top navigation.\n" +
                      "2. Select your desired museum and click **Book Tickets**.\n" +
                      "3. Choose your visit date and the number of Adult, Child, and Senior visitors.\n" +
                      "4. Confirm and complete your payment via UPI or Card.\n" +
                      "5. Your digital ticket with unique reference ID will be immediately available under **My Bookings**!",
                suggestions: ["View Museums", "Taj Mahal", "Salar Jung Museum", "My Bookings"]
            };
        }

        // 9. DEFAULT FALLBACK WITH HELPFUL PROMPTS
        return {
            text: `I'd love to help you with that! You can ask me:\n\n` +
                  `• "Ticket price of Taj Mahal"\n` +
                  `• "Museums in Telangana" or "Museums in Delhi"\n` +
                  `• "Opening hours of Salar Jung Museum"\n` +
                  `• "What are my bookings?"\n` +
                  `• "How do I cancel a ticket?"\n` +
                  `• "Accessibility and photography rules"`,
            suggestions: [
                "Museums in Telangana",
                "Taj Mahal Ticket Price",
                "Explore Collections",
                "My Bookings"
            ]
        };
    }
}

module.exports = ChatbotService;
