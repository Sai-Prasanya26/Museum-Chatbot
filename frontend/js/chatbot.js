/* ==========================================================
   Original QBOT Chatbot Logic - Restored from login1/ticket.html
   Connected to Node.js & MySQL Backend (/api/museums, /api/bookings)
   Primary Color: #2962ff
   ========================================================== */

(function () {
    // Core Configuration
    const welcomeMessages = [
        "👋 Hi there! I'm your friendly QBot!",
        "I can provide more information on Museum Timings, assist with Ticket Bookings, and more!",
        "How can I assist you today?"
    ];

    const options = [
        { text: "🎫 Book Tickets", responseKey: "booking", keywords: ["book", "ticket", "booking"] },
        { text: "⏰ Check Timings", responseKey: "timings", keywords: ["time", "timing", "hours", "open"] },
        { text: "💰 Ticket Prices", responseKey: "prices", keywords: ["price", "cost", "fee", "rate"] },
        { text: "ℹ️ Learn about Collections", responseKey: "collections", keywords: ["collection", "exhibit", "display", "show"] },
        { text: "❓ Ask a Question", responseKey: "Questions", keywords: ["question", "help", "ask"] }
    ];

    // State Management
    let chatOpen = false;
    let currentState = null;
    let currentMuseumsByState = null;
    let cachedMuseumData = null;
    let bookingSession = {
        museum: null,
        museumObj: null,
        date: null,
        rawDate: null,
        prices: null,
        counts: { adult: 0, child: 0, senior: 0 },
        total: 0
    };

    // DOM Elements references
    let chatMessages, userInput, sendButton, chatIcon, chatbot;

    // Initialization on page load
    document.addEventListener('DOMContentLoaded', () => {
        initChatbotDOM();
    });

    function initChatbotDOM() {
        const isStandalone = document.body.classList.contains('chatbot-standalone-page');

        // Check if elements already exist in HTML (like in ticket.html)
        chatbot = document.getElementById('chatbot');
        chatIcon = document.getElementById('chat-icon');

        if (!chatbot) {
            const botDiv = document.createElement('div');
            botDiv.id = 'chatbot';
            botDiv.innerHTML = `
                <div class="chat-header">
                    <h3><i class="fas fa-robot"></i> QBOT</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div id="chat-messages"></div>
                <div id="user-input-container">
                    <input type="text" id="user-input" placeholder="Type your message here...">
                    <button id="send-btn"><i class="fas fa-paper-plane"></i></button>
                </div>
            `;
            document.body.appendChild(botDiv);
            chatbot = botDiv;
        }

        if (!chatIcon && !isStandalone) {
            const iconDiv = document.createElement('div');
            iconDiv.id = 'chat-icon';
            iconDiv.innerHTML = `<i class="fas fa-comments" style="color: white; font-size: 1.8rem;"></i>`;
            document.body.appendChild(iconDiv);
            chatIcon = iconDiv;
        }

        chatMessages = document.getElementById('chat-messages');
        userInput = document.getElementById('user-input');
        sendButton = document.getElementById('send-btn');

        // Bind events
        if (chatIcon) {
            chatIcon.onclick = () => {
                chatOpen = !chatOpen;
                chatbot.style.display = chatOpen ? 'flex' : 'none';
                if (chatOpen && chatMessages.children.length === 0) {
                    displayWelcomeMessages();
                }
            };
        }

        const closeBtn = chatbot.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                chatOpen = false;
                chatbot.style.display = 'none';
            };
        }

        if (sendButton && userInput) {
            sendButton.onclick = () => {
                const message = userInput.value.trim();
                if (message) {
                    handleUserInput(message);
                    userInput.value = '';
                }
            };

            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const message = userInput.value.trim();
                    if (message) {
                        handleUserInput(message);
                        userInput.value = '';
                    }
                }
            });
        }

        // Auto display if standalone
        if (isStandalone) {
            chatOpen = true;
            chatbot.style.display = 'flex';
            displayWelcomeMessages();
        }
    }

    // Core Utility Functions
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return indicator;
    }

    async function sendTypingMessage(text) {
        const indicator = showTypingIndicator();
        await new Promise(resolve => setTimeout(resolve, 800));
        indicator.remove();
        addMessage(text);
    }

    function addMessage(text, isUserMessage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUserMessage ? 'user-message' : 'bot-message';
        messageDiv.innerHTML = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addOptions() {
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.className = 'option-btn';
            button.onclick = () => handleOptionClick(option.responseKey);
            chatMessages.appendChild(button);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Core Data Fetching Function connected to MySQL backend (/api/museums)
    async function fetchMuseumData() {
        if (cachedMuseumData) return cachedMuseumData;

        try {
            const response = await fetch('/api/museums');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const resData = await response.json();
            const rawList = Array.isArray(resData) ? resData : (resData.data || []);

            // Harmonize data format for both MySQL and original formats
            const cleanedData = rawList.map(item => ({
                id: item.id,
                Museum: item.Museum || item.name,
                name: item.name || item.Museum,
                State: item.State || item.state,
                state: item.state || item.State,
                city: item.city || item.City || '',
                opening_time: item.opening_time || '10:00 AM',
                closing_time: item.closing_time || '05:00 PM',
                Adult_Ticket_Price: parseFloat(item['Adult Ticket Price'] || item.Adult_Ticket_Price || item.adult_price || 150),
                Child_Ticket_Price: parseFloat(item['Child Ticket Price'] || item.Child_Ticket_Price || item.child_price || 75),
                Senior_Ticket_Price: parseFloat(item['Senior Ticket Price'] || item.Senior_Ticket_Price || item.senior_price || 100)
            }));

            const states = [...new Set(cleanedData.map(item => item.State).filter(Boolean))].sort();
            const museumsByState = cleanedData.reduce((acc, item) => {
                if (item.State) {
                    acc[item.State] = acc[item.State] || [];
                    acc[item.State].push(item.Museum);
                }
                return acc;
            }, {});

            cachedMuseumData = { states, museumsByState, museums: cleanedData };
            return cachedMuseumData;
        } catch (error) {
            console.error("Error fetching museum data:", error);
            addMessage("I'm having trouble accessing museum data from the database. Please try again later.");
            return null;
        }
    }

    // Unified Ticket Price Function
    async function fetchTicketPrices(museumName) {
        try {
            const data = await fetchMuseumData();
            if (!data) throw new Error('Failed to fetch museum data');

            const selectedMuseum = data.museums.find(m =>
                m.Museum.toLowerCase() === museumName.toLowerCase() ||
                m.name.toLowerCase() === museumName.toLowerCase()
            );

            if (!selectedMuseum) throw new Error('Museum not found');

            return {
                museumObj: selectedMuseum,
                adult: selectedMuseum.Adult_Ticket_Price,
                child: selectedMuseum.Child_Ticket_Price,
                senior: selectedMuseum.Senior_Ticket_Price
            };
        } catch (error) {
            console.error("Error fetching ticket prices:", error);
            return {
                museumObj: null,
                adult: 150,
                child: 75,
                senior: 100
            };
        }
    }

    // Booking and Pricing Functions
    async function showPricesOnly(museum) {
        const prices = await fetchTicketPrices(museum);
        if (!prices) {
            await sendTypingMessage("I'm having trouble accessing ticket prices. Please try again later.");
            return;
        }

        const priceContainer = document.createElement('div');
        priceContainer.className = 'price-display-container';
        priceContainer.style.padding = '15px';
        priceContainer.style.margin = '10px 0';
        priceContainer.style.background = 'white';
        priceContainer.style.borderRadius = '12px';
        priceContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        const museumHeader = document.createElement('div');
        museumHeader.style.fontSize = '1.1em';
        museumHeader.style.fontWeight = 'bold';
        museumHeader.style.color = '#2962ff';
        museumHeader.style.marginBottom = '15px';
        museumHeader.textContent = `${museum} - Ticket Prices`;
        priceContainer.appendChild(museumHeader);

        const priceCardsContainer = document.createElement('div');
        priceCardsContainer.style.display = 'flex';
        priceCardsContainer.style.gap = '10px';
        priceCardsContainer.style.flexWrap = 'wrap';
        priceCardsContainer.style.justifyContent = 'center';

        const ticketTypes = [
            { type: 'Adult', price: prices.adult, icon: '👤', description: 'Ages 13-59', color: '#2962ff' },
            { type: 'Child', price: prices.child, icon: '👶', description: 'Ages 5-12', color: '#2e7d32' },
            { type: 'Senior', price: prices.senior, icon: '👴', description: 'Ages 60+', color: '#ad1457' }
        ];

        ticketTypes.forEach(ticket => {
            const card = createPriceCard(ticket);
            priceCardsContainer.appendChild(card);
        });

        priceContainer.appendChild(priceCardsContainer);

        const infoSection = document.createElement('div');
        infoSection.style.marginTop = '20px';
        infoSection.style.padding = '15px';
        infoSection.style.background = '#f8f9fa';
        infoSection.style.borderRadius = '8px';
        infoSection.style.fontSize = '0.9em';

        const infoPoints = [
            "✨ Special group discounts available for 10+ visitors",
            "🎓 Student discounts available with valid ID",
            "🌟 Free entry for children under 5 years",
            "♿ Special rates for differently-abled visitors"
        ];

        infoPoints.forEach(info => {
            const infoLine = document.createElement('div');
            infoLine.style.marginBottom = '8px';
            infoLine.textContent = info;
            infoSection.appendChild(infoLine);
        });

        priceContainer.appendChild(infoSection);

        const bookingContainer = document.createElement('div');
        bookingContainer.style.textAlign = 'center';
        bookingContainer.style.marginTop = '20px';

        const bookNowBtn = document.createElement('button');
        bookNowBtn.textContent = '🎟️ Book Tickets';
        bookNowBtn.className = 'option-btn';
        bookNowBtn.style.background = '#2962ff';
        bookNowBtn.style.color = 'white';
        bookNowBtn.style.padding = '12px 24px';
        bookNowBtn.onclick = () => handleMuseumSelection(museum);

        bookingContainer.appendChild(bookNowBtn);
        priceContainer.appendChild(bookingContainer);

        chatMessages.appendChild(priceContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createPriceCard(ticketType) {
        const card = document.createElement('div');
        card.className = 'price-card';
        card.style.flex = '1';
        card.style.minWidth = '140px';
        card.style.padding = '15px';
        card.style.borderRadius = '8px';
        card.style.background = '#f8f9fa';
        card.style.border = `2px solid ${ticketType.color}`;
        card.style.textAlign = 'center';
        card.style.transition = 'all 0.3s ease';

        card.onmouseover = () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)';
        };

        card.onmouseout = () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        };

        const icon = document.createElement('div');
        icon.style.fontSize = '2em';
        icon.style.marginBottom = '10px';
        icon.textContent = ticketType.icon;

        const type = document.createElement('div');
        type.style.fontWeight = 'bold';
        type.style.color = ticketType.color;
        type.style.marginBottom = '5px';
        type.textContent = ticketType.type;

        const description = document.createElement('div');
        description.style.fontSize = '0.8em';
        description.style.color = '#666';
        description.style.marginBottom = '10px';
        description.textContent = ticketType.description;

        const price = document.createElement('div');
        price.style.fontSize = '1.2em';
        price.style.fontWeight = 'bold';
        price.style.color = ticketType.color;
        price.textContent = `₹${ticketType.price}`;

        card.appendChild(icon);
        card.appendChild(type);
        card.appendChild(description);
        card.appendChild(price);

        return card;
    }

    async function handleMuseumSelection(museum) {
        bookingSession.museum = museum;
        const prices = await fetchTicketPrices(museum);
        bookingSession.prices = prices;
        bookingSession.museumObj = prices.museumObj;

        await sendTypingMessage(`You have selected ${museum}.`);
        await sendTypingMessage("Please select your preferred date of visit:");

        const dateContainer = createDateSelectionContainer();
        const dateInput = createDateInput();
        const confirmBtn = createConfirmButton(museum, dateInput, dateContainer);

        dateContainer.appendChild(dateInput);
        dateContainer.appendChild(confirmBtn);
        chatMessages.appendChild(dateContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createDateSelectionContainer() {
        const container = document.createElement('div');
        container.className = 'date-selection';
        container.style.padding = '15px';
        container.style.margin = '10px 0';
        container.style.background = 'white';
        container.style.borderRadius = '12px';
        container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        return container;
    }

    function createDateInput() {
        const input = document.createElement('input');
        input.type = 'date';
        input.min = getTodayFormatted();
        input.style.padding = '10px';
        input.style.borderRadius = '8px';
        input.style.border = '1px solid #e0e4e9';
        input.style.marginRight = '10px';
        input.style.width = '200px';
        return input;
    }

    function createConfirmButton(museum, dateInput, dateContainer) {
        const btn = document.createElement('button');
        btn.textContent = 'Confirm Date';
        btn.className = 'option-btn';
        btn.style.background = '#2962ff';
        btn.style.color = 'white';
        btn.style.padding = '10px 20px';

        btn.onclick = async () => {
            if (dateInput.value) {
                bookingSession.rawDate = dateInput.value;
                const selectedDate = new Date(dateInput.value);
                const formattedDate = selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                bookingSession.date = formattedDate;

                dateContainer.remove();
                await confirmDate(formattedDate, museum);
            } else {
                await sendTypingMessage("Please select a valid date.");
            }
        };

        return btn;
    }

    async function confirmDate(formattedDate, museum) {
        await sendTypingMessage(`You have selected to visit on ${formattedDate}.`);
        await sendTypingMessage("Would you like to view the ticket prices?");

        const viewPricesBtn = document.createElement('button');
        viewPricesBtn.textContent = "View Ticket Prices";
        viewPricesBtn.className = 'option-btn';

        viewPricesBtn.onclick = async () => {
            const prices = await fetchTicketPrices(museum);
            bookingSession.prices = prices;
            bookingSession.museumObj = prices.museumObj;

            if (prices && prices.adult !== undefined) {
                const priceContainer = document.createElement('div');
                priceContainer.className = 'price-display-container';
                priceContainer.style.padding = '15px';
                priceContainer.style.margin = '10px 0';
                priceContainer.style.background = 'white';
                priceContainer.style.borderRadius = '12px';
                priceContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

                const museumHeader = document.createElement('div');
                museumHeader.style.fontSize = '1.1em';
                museumHeader.style.fontWeight = 'bold';
                museumHeader.style.color = '#2962ff';
                museumHeader.style.marginBottom = '15px';
                museumHeader.textContent = `${museum} - Ticket Prices`;
                priceContainer.appendChild(museumHeader);

                const priceCardsContainer = document.createElement('div');
                priceCardsContainer.style.display = 'flex';
                priceCardsContainer.style.gap = '10px';
                priceCardsContainer.style.flexWrap = 'wrap';
                priceCardsContainer.style.justifyContent = 'center';

                const ticketTypes = [
                    { type: 'Adult', price: prices.adult, icon: '👤', description: 'Ages 13-59', color: '#2962ff' },
                    { type: 'Child', price: prices.child, icon: '👶', description: 'Ages 5-12', color: '#2e7d32' },
                    { type: 'Senior', price: prices.senior, icon: '👴', description: 'Ages 60+', color: '#ad1457' }
                ];

                ticketTypes.forEach(ticket => {
                    const card = createPriceCard(ticket);
                    priceCardsContainer.appendChild(card);
                });

                priceContainer.appendChild(priceCardsContainer);

                const bookingContainer = document.createElement('div');
                bookingContainer.style.textAlign = 'center';
                bookingContainer.style.marginTop = '20px';

                const bookNowBtn = document.createElement('button');
                bookNowBtn.textContent = 'Book Tickets';
                bookNowBtn.className = 'option-btn';
                bookNowBtn.style.background = '#2962ff';
                bookNowBtn.style.color = 'white';
                bookNowBtn.style.padding = '12px 24px';
                bookNowBtn.style.fontWeight = 'bold';

                bookNowBtn.onclick = () => {
                    priceContainer.remove();
                    displayTicketQuantityInput(prices);
                };

                bookingContainer.appendChild(bookNowBtn);
                priceContainer.appendChild(bookingContainer);

                chatMessages.appendChild(priceContainer);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                viewPricesBtn.remove();
            } else {
                await sendTypingMessage("I apologize, but I couldn't retrieve the ticket prices for this museum. Please try again later.");
            }
        };

        chatMessages.appendChild(viewPricesBtn);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function displayTicketQuantityInput(prices) {
        const quantityContainer = document.createElement('div');
        quantityContainer.className = 'quantity-selection';
        quantityContainer.style.padding = '15px';
        quantityContainer.style.margin = '10px 0';
        quantityContainer.style.background = 'white';
        quantityContainer.style.borderRadius = '12px';
        quantityContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        const header = document.createElement('div');
        header.style.fontSize = '1.1em';
        header.style.fontWeight = 'bold';
        header.style.color = '#2962ff';
        header.style.marginBottom = '15px';
        header.textContent = 'Select Number of Tickets';
        quantityContainer.appendChild(header);

        const inputsContainer = createTicketInputsContainer(prices);
        const calculateBtn = createCalculateButton(prices, quantityContainer);

        quantityContainer.appendChild(inputsContainer);
        quantityContainer.appendChild(calculateBtn);
        chatMessages.appendChild(quantityContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createTicketInputsContainer(prices) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '15px';
        container.style.flexWrap = 'wrap';
        container.style.justifyContent = 'center';
        container.style.marginBottom = '20px';

        const categories = [
            { label: 'Adults', key: 'adult', icon: '👤', color: '#2962ff', price: prices.adult },
            { label: 'Children', key: 'child', icon: '👶', color: '#2e7d32', price: prices.child },
            { label: 'Seniors', key: 'senior', icon: '👴', color: '#ad1457', price: prices.senior }
        ];

        categories.forEach(category => {
            const wrapper = createTicketTypeWrapper(category);
            container.appendChild(wrapper);
        });

        return container;
    }

    function createTicketTypeWrapper(category) {
        const wrapper = document.createElement('div');
        wrapper.style.flex = '1';
        wrapper.style.minWidth = '140px';
        wrapper.style.padding = '10px';
        wrapper.style.background = '#f8f9fa';
        wrapper.style.borderRadius = '8px';
        wrapper.style.border = `2px solid ${category.color}`;
        wrapper.style.textAlign = 'center';

        const icon = document.createElement('div');
        icon.style.fontSize = '1.5em';
        icon.style.marginBottom = '5px';
        icon.textContent = category.icon;

        const label = document.createElement('label');
        label.textContent = category.label;
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.color = category.color;
        label.style.fontWeight = 'bold';

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.value = '0';
        input.className = `${category.key}-input`;
        input.style.width = '60px';
        input.style.padding = '8px';
        input.style.borderRadius = '5px';
        input.style.border = '1px solid #e0e4e9';
        input.style.textAlign = 'center';

        wrapper.appendChild(icon);
        wrapper.appendChild(label);
        wrapper.appendChild(input);

        return wrapper;
    }

    function createCalculateButton(prices, quantityContainer) {
        const btn = document.createElement('button');
        btn.textContent = 'Calculate Total';
        btn.className = 'option-btn';
        btn.style.background = '#2962ff';
        btn.style.color = 'white';
        btn.style.padding = '12px 24px';
        btn.style.fontWeight = 'bold';
        btn.style.width = 'auto';
        btn.style.margin = '0 auto';
        btn.style.display = 'block';

        btn.onclick = () => calculateAndShowTotal(prices, quantityContainer);
        return btn;
    }

    async function calculateAndShowTotal(prices, quantityContainer) {
        const counts = {
            adult: parseInt(document.querySelector('.adult-input')?.value || 0, 10),
            child: parseInt(document.querySelector('.child-input')?.value || 0, 10),
            senior: parseInt(document.querySelector('.senior-input')?.value || 0, 10)
        };

        const total = (counts.adult * prices.adult) +
            (counts.child * prices.child) +
            (counts.senior * prices.senior);

        bookingSession.counts = counts;
        bookingSession.total = total;

        showBookingSummary(counts, prices, total);
        quantityContainer.remove();
    }

    function showBookingSummary(counts, prices, total) {
        const summaryCard = createSummaryCard(counts, prices, total);
        chatMessages.appendChild(summaryCard);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createSummaryCard(counts, prices, total) {
        const card = document.createElement('div');
        card.style.background = 'white';
        card.style.padding = '15px';
        card.style.borderRadius = '12px';
        card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        card.style.margin = '10px 0';

        const header = document.createElement('div');
        header.style.fontSize = '1.1em';
        header.style.fontWeight = 'bold';
        header.style.color = '#2962ff';
        header.style.marginBottom = '15px';
        header.textContent = 'Booking Summary';
        card.appendChild(header);

        if (counts.adult > 0) appendTicketLine(card, '👤', counts.adult, 'Adult', prices.adult);
        if (counts.child > 0) appendTicketLine(card, '👶', counts.child, 'Child', prices.child);
        if (counts.senior > 0) appendTicketLine(card, '👴', counts.senior, 'Senior', prices.senior);

        appendTotalLine(card, total);

        if (total > 0) {
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = "Proceed to Payment";
            confirmBtn.className = 'option-btn';
            confirmBtn.style.background = '#2962ff';
            confirmBtn.style.color = 'white';
            confirmBtn.style.padding = '12px 24px';
            confirmBtn.style.fontWeight = 'bold';
            confirmBtn.style.marginTop = '15px';
            confirmBtn.onclick = () => proceedToPayment(total);
            card.appendChild(confirmBtn);
        } else {
            const warning = document.createElement('p');
            warning.style.color = '#d32f2f';
            warning.style.marginTop = '10px';
            warning.textContent = 'Please select at least 1 ticket to proceed.';
            card.appendChild(warning);
        }

        return card;
    }

    function appendTicketLine(card, icon, count, type, price) {
        const line = document.createElement('div');
        line.style.marginBottom = '8px';
        line.innerHTML = `${icon} ${count} ${type} ticket(s): ₹${count * price}`;
        card.appendChild(line);
    }

    function appendTotalLine(card, total) {
        const totalLine = document.createElement('div');
        totalLine.style.borderTop = '2px solid #e0e4e9';
        totalLine.style.marginTop = '10px';
        totalLine.style.paddingTop = '10px';
        totalLine.style.fontWeight = 'bold';
        totalLine.innerHTML = `Total amount: ₹${total}`;
        card.appendChild(totalLine);
    }

    async function proceedToPayment(total) {
        await sendTypingMessage("Please scan the UPI QR code below to complete the payment:");

        const paymentContainer = document.createElement('div');
        paymentContainer.style.background = 'white';
        paymentContainer.style.padding = '15px';
        paymentContainer.style.borderRadius = '12px';
        paymentContainer.style.margin = '10px 0';
        paymentContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        paymentContainer.style.maxWidth = '100%';

        const upiSection = createUPIPaymentSection(total);
        paymentContainer.appendChild(upiSection);

        chatMessages.appendChild(paymentContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createUPIPaymentSection(total) {
        const section = document.createElement('div');
        section.style.textAlign = 'center';
        section.style.maxWidth = '100%';

        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const defaultEmail = userObj.email || '';
        const defaultName = userObj.username || '';

        const qrCode = document.createElement('div');
        qrCode.style.width = '160px';
        qrCode.style.height = '160px';
        qrCode.style.margin = '10px auto';
        qrCode.style.background = '#ffffff';
        qrCode.style.border = '1.5px solid #e0e4e9';
        qrCode.style.borderRadius = '8px';
        qrCode.style.display = 'flex';
        qrCode.style.flexDirection = 'column';
        qrCode.style.alignItems = 'center';
        qrCode.style.justifyContent = 'center';
        qrCode.innerHTML = `
            <img src="/images/scanner.png" alt="UPI QR" style="max-width: 140px; max-height: 140px; object-fit: contain; border-radius: 4px;" onerror="this.src='/assets/images/scanner.png'">
        `;

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #1e3a8a;">
                UPI ID: <span style="font-family: monospace;">museums.tickets@icici</span>
            </div>
            <div style="margin-bottom: 12px; text-align: left;">
                <label style="display: block; margin-bottom: 5px; color: #333; font-size: 0.9em; font-weight: 600;">Visitor Name</label>
                <input type="text" id="upiName" placeholder="Full Name" value="${defaultName}" required
                    style="width: 100%; padding: 8px; border: 1px solid #e0e4e9; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 12px; text-align: left;">
                <label style="display: block; margin-bottom: 5px; color: #333; font-size: 0.9em; font-weight: 600;">Email for Receipt</label>
                <input type="email" id="upiEmail" placeholder="email@example.com" value="${defaultEmail}" required
                    style="width: 100%; padding: 8px; border: 1px solid #e0e4e9; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 12px; text-align: left;">
                <label style="display: block; margin-bottom: 5px; color: #333; font-size: 0.9em; font-weight: 600;">UPI Ref / UTR Number</label>
                <input type="text" id="upiTxnId" placeholder="12-digit UTR from UPI app" required
                    style="width: 100%; padding: 8px; border: 1px solid #e0e4e9; border-radius: 6px; font-size: 14px; box-sizing: border-box; font-family: monospace;">
                <small style="color: #64748b; font-size: 0.8em; display: block; margin-top: 3px;">Pay ₹${total} in your UPI app, then paste the 12-digit UTR here.</small>
            </div>
            <div style="font-size: 0.85rem; color: #b45309; background: #fffbeb; padding: 6px 10px; border-radius: 4px; margin-bottom: 10px; text-align: left;">
                ⚠️ Payment must be verified before booking confirmation.
            </div>
        `;

        const payButton = createEnhancedPayButton(total);
        section.appendChild(qrCode);
        section.appendChild(form);
        form.appendChild(payButton);

        form.onsubmit = (e) => handleUPIPayment(e, total);
        return section;
    }

    function createEnhancedPayButton(total) {
        const button = document.createElement('button');
        button.type = 'submit';
        button.style.width = '100%';
        button.style.padding = '12px';
        button.style.border = 'none';
        button.style.borderRadius = '8px';
        button.style.background = 'linear-gradient(135deg, #2962ff, #1565c0)';
        button.style.color = 'white';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';
        button.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        button.innerHTML = `<span>Complete Payment - ₹${total}</span> <span style="margin-left: 8px;">→</span>`;

        button.onmouseover = () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 8px rgba(41, 98, 255, 0.3)';
        };

        button.onmouseout = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        };

        return button;
    }

    // Backend Connected Payment Handlers
    // Backend Connected Payment Handlers (Authoritative UPI Verification)
    async function submitBookingToBackend(transactionId, visitorEmail, visitorName) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const museumId = bookingSession.museumObj ? bookingSession.museumObj.id : 1;
        const visitDate = bookingSession.rawDate || getTodayFormatted();

        const payload = {
            museum_id: museumId,
            visit_date: visitDate,
            adult_count: bookingSession.counts.adult,
            child_count: bookingSession.counts.child,
            senior_count: bookingSession.counts.senior,
            payment_method: 'UPI',
            transaction_id: transactionId,
            email: visitorEmail,
            visitor_email: visitorEmail,
            name: visitorName,
            visitor_name: visitorName
        };

        const res = await fetch('/api/payments/verify', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        return data;
    }

    async function handleUPIPayment(e, total) {
        e.preventDefault();
        const upiName = document.getElementById('upiName') ? document.getElementById('upiName').value.trim() : 'Visitor';
        const upiEmail = document.getElementById('upiEmail').value.trim();
        const upiTxnId = document.getElementById('upiTxnId') ? document.getElementById('upiTxnId').value.trim() : '';

        if (!upiTxnId) {
            await sendTypingMessage("⚠️ Payment has not been verified. Please complete the UPI payment and provide the 12-digit UPI Transaction / UTR reference.");
            return;
        }

        const indicator = showTypingIndicator();

        try {
            const result = await submitBookingToBackend(upiTxnId, upiEmail, upiName);
            indicator.remove();

            if (result.success && result.data) {
                const booking = result.data;
                const ref = booking.booking_reference;
                await sendTypingMessage(`🎉 **UPI Payment verified & Ticket Confirmed!**\n\n` +
                    `🏛️ **Museum:** ${booking.museum_name || bookingSession.museum}\n` +
                    `📅 **Date of Visit:** ${booking.visit_date}\n` +
                    `🎫 **Booking Reference:** \`${ref}\`\n` +
                    `💰 **Amount Paid:** ₹${booking.total_price || total} (PAID)\n` +
                    `🔖 **Payment Status:** Confirmed (PAID)\n\n` +
                    `Receipt has been automatically sent to ${upiEmail}.`
                );

                const viewBtn = document.createElement('a');
                viewBtn.href = `/mybookings.html`;
                viewBtn.className = 'option-btn';
                viewBtn.style.background = '#2962ff';
                viewBtn.style.color = 'white';
                viewBtn.style.textAlign = 'center';
                viewBtn.style.marginTop = '10px';
                viewBtn.textContent = '📄 View My Bookings & Receipts';
                chatMessages.appendChild(viewBtn);

                const pdfBtn = document.createElement('a');
                pdfBtn.href = `/api/bookings/reference/${encodeURIComponent(ref)}/pdf`;
                pdfBtn.target = '_blank';
                pdfBtn.className = 'option-btn';
                pdfBtn.style.background = '#16a34a';
                pdfBtn.style.color = 'white';
                pdfBtn.style.textAlign = 'center';
                pdfBtn.style.marginTop = '6px';
                pdfBtn.textContent = '📥 Download PDF Ticket';
                chatMessages.appendChild(pdfBtn);
            } else {
                await sendTypingMessage(`⚠️ ${result.message || 'Payment could not be verified. Your booking has not been confirmed.'}`);
            }
        } catch (err) {
            indicator.remove();
            console.error('Booking error:', err);
            await sendTypingMessage("⚠️ Payment could not be verified. Your booking has not been confirmed.");
        }
    }

    // Display and UI Functions
    async function displayWelcomeMessages() {
        chatMessages.innerHTML = '';
        currentState = null;
        currentMuseumsByState = null;
        for (const msg of welcomeMessages) {
            await sendTypingMessage(msg);
        }
        addOptions();
    }

    // State Selection Functions
    async function displayStateOptionsForBooking(states, museumsByState) {
        const statesContainer = createStatesContainer();

        states.forEach(state => {
            const button = createStateButton(state, museumsByState[state]);
            button.onclick = () => handleStateSelectionForBooking(state, museumsByState[state]);
            statesContainer.appendChild(button);
        });

        chatMessages.appendChild(statesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createStatesContainer() {
        const container = document.createElement('div');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
        container.style.gap = '10px';
        container.style.padding = '15px';
        container.style.background = 'white';
        container.style.borderRadius = '12px';
        container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        container.style.maxHeight = '240px';
        container.style.overflowY = 'auto';
        return container;
    }

    function createStateButton(state, museums) {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.style.width = '100%';
        button.style.padding = '12px';
        button.style.textAlign = 'center';
        button.style.borderRadius = '8px';

        const museumCount = museums ? museums.length : 0;
        button.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${state}</div>
            <div style="font-size: 0.8em; opacity: 0.7">${museumCount} museum${museumCount !== 1 ? 's' : ''}</div>
        `;
        return button;
    }

    async function handleStateSelectionForBooking(state, museums) {
        currentState = state;
        await sendTypingMessage(`You have selected ${state}.`);
        await sendTypingMessage("Please select a museum to book tickets:");

        const museumContainer = createMuseumContainer();

        museums.forEach(museum => {
            const button = createMuseumButton(museum);
            button.onclick = () => handleMuseumSelection(museum);
            museumContainer.appendChild(button);
        });

        chatMessages.appendChild(museumContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createMuseumContainer() {
        const container = document.createElement('div');
        container.style.padding = '10px';
        container.style.margin = '10px 0';
        container.style.background = 'white';
        container.style.borderRadius = '12px';
        container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        container.style.maxHeight = '240px';
        container.style.overflowY = 'auto';
        return container;
    }

    function createMuseumButton(museum) {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.style.display = 'block';
        button.style.width = '100%';
        button.style.marginBottom = '8px';
        button.style.textAlign = 'left';
        button.style.padding = '10px 15px';
        button.innerHTML = `🏛️ ${museum}`;
        return button;
    }

    // Date Utility
    function getTodayFormatted() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Main Option Click Handler
    async function handleOptionClick(responseKey) {
        const option = options.find(o => o.responseKey === responseKey);
        if (!option) return;

        addMessage(option.text, true);

        const indicator = showTypingIndicator();
        await new Promise(resolve => setTimeout(resolve, 800));
        indicator.remove();

        await sendTypingMessage(`I see you're interested in ${option.text.split(' ').slice(1).join(' ')}!`);
        await sendTypingMessage(`I'm happy to help you with that. Let me guide you through the process.`);

        if (responseKey === "booking") {
            await sendTypingMessage("First, please select a state to begin your booking:");
            const data = await fetchMuseumData();
            if (data) {
                displayStateOptionsForBooking(data.states, data.museumsByState);
            }
        }
        else if (responseKey === "prices") {
            await sendTypingMessage("First, please select a state to check ticket prices:");
            const data = await fetchMuseumData();
            if (data) {
                displayStateOptionsForPrices(data.states, data.museumsByState);
            }
        }
        else if (responseKey === "timings") {
            await sendTypingMessage("Please select a state to check museum timings:");
            const data = await fetchMuseumData();
            if (data) {
                displayStateOptionsForTimings(data.states, data.museumsByState);
            }
        }
        else if (responseKey === "collections") {
            await handleCollections();
        }
        else if (responseKey === "Questions") {
            await handleQuestions();
        }
    }

    // User Text Input Handler
    async function handleUserInput(message) {
        addMessage(message, true);
        const lowercaseMsg = message.toLowerCase();

        const matchedOption = options.find(option =>
            option.keywords.some(keyword => lowercaseMsg.includes(keyword))
        );

        if (matchedOption) {
            await handleOptionClick(matchedOption.responseKey);
            return;
        }

        const isQuestion = lowercaseMsg.includes('?') ||
            lowercaseMsg.startsWith('what') ||
            lowercaseMsg.startsWith('how') ||
            lowercaseMsg.startsWith('when') ||
            lowercaseMsg.startsWith('where') ||
            lowercaseMsg.startsWith('why') ||
            lowercaseMsg.startsWith('can') ||
            lowercaseMsg.startsWith('do');

        if (isQuestion) {
            await handleQuestionSearch(message);
            return;
        }

        // Check if user typed a museum name directly
        const data = await fetchMuseumData();
        if (data) {
            const found = data.museums.find(m =>
                m.Museum.toLowerCase().includes(lowercaseMsg) ||
                lowercaseMsg.includes(m.Museum.toLowerCase())
            );
            if (found) {
                await sendTypingMessage(`Found **${found.Museum}** in ${found.State}!`);
                await showPricesOnly(found.Museum);
                return;
            }
        }

        await sendTypingMessage("I'm not sure what you're looking for. Let me show you what I can help you with:");
        addOptions();
    }

    // Price Exploration Handlers
    async function displayStateOptionsForPrices(states, museumsByState) {
        const statesContainer = createStatesContainer();

        states.forEach(state => {
            const button = createStateButton(state, museumsByState[state]);
            button.onclick = () => handleStateSelectionForPrices(state, museumsByState[state]);
            statesContainer.appendChild(button);
        });

        chatMessages.appendChild(statesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleStateSelectionForPrices(state, museums) {
        currentState = state;
        await sendTypingMessage(`You have selected ${state}.`);
        await sendTypingMessage("Please select a museum to view its ticket prices:");

        const museumContainer = createMuseumContainer();

        museums.forEach(museum => {
            const button = createMuseumButton(museum);
            button.onclick = () => showPricesOnly(museum);
            museumContainer.appendChild(button);
        });

        chatMessages.appendChild(museumContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Timings Handlers
    async function displayStateOptionsForTimings(states, museumsByState) {
        const statesContainer = createStatesContainer();

        states.forEach(state => {
            const button = createStateButton(state, museumsByState[state]);
            button.onclick = () => handleStateSelectionForTimings(state, museumsByState[state]);
            statesContainer.appendChild(button);
        });

        chatMessages.appendChild(statesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleStateSelectionForTimings(state, museums) {
        currentState = state;
        await sendTypingMessage(`You have selected ${state}.`);
        await sendTypingMessage("Please select a museum to view its timings:");

        const museumContainer = createMuseumContainer();

        museums.forEach(museum => {
            const button = createMuseumButton(museum);
            button.onclick = () => showMuseumTimings(museum);
            museumContainer.appendChild(button);
        });

        chatMessages.appendChild(museumContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function showMuseumTimings(museum) {
        const timingsContainer = document.createElement('div');
        timingsContainer.className = 'timings-display-container';
        timingsContainer.style.padding = '15px';
        timingsContainer.style.margin = '10px 0';
        timingsContainer.style.background = 'white';
        timingsContainer.style.borderRadius = '12px';
        timingsContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

        const museumHeader = document.createElement('div');
        museumHeader.style.fontSize = '1.1em';
        museumHeader.style.fontWeight = 'bold';
        museumHeader.style.color = '#2962ff';
        museumHeader.style.marginBottom = '15px';
        museumHeader.textContent = `${museum} - Operating Hours`;
        timingsContainer.appendChild(museumHeader);

        const timingsContent = createTimingsContent();
        const additionalInfo = createTimingsAdditionalInfo();

        const bookingSection = document.createElement('div');
        bookingSection.style.marginTop = '20px';
        bookingSection.style.textAlign = 'center';
        bookingSection.style.padding = '15px';
        bookingSection.style.borderTop = '1px solid #e0e4e9';

        const bookingText = document.createElement('div');
        bookingText.style.marginBottom = '15px';
        bookingText.style.color = '#666';
        bookingText.textContent = 'Ready to visit? Book your tickets now!';

        const bookButton = document.createElement('button');
        bookButton.className = 'option-btn';
        bookButton.style.background = '#2962ff';
        bookButton.style.color = 'white';
        bookButton.style.padding = '12px 24px';
        bookButton.style.fontWeight = 'bold';
        bookButton.innerHTML = '🎟️ Book Tickets';

        bookButton.onclick = async () => {
            timingsContainer.remove();
            await handleMuseumSelection(museum);
        };

        bookingSection.appendChild(bookingText);
        bookingSection.appendChild(bookButton);

        timingsContainer.appendChild(timingsContent);
        timingsContainer.appendChild(additionalInfo);
        timingsContainer.appendChild(bookingSection);

        chatMessages.appendChild(timingsContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        await sendTypingMessage("You can check ticket prices and make a booking by clicking the 'Book Tickets' button above.");
    }

    function createTimingsContent() {
        const content = document.createElement('div');
        content.style.padding = '10px';
        content.style.background = '#f8f9fa';
        content.style.borderRadius = '8px';
        content.style.border = '2px solid #2962ff';

        const operatingHours = [
            { day: 'Tuesday - Sunday', time: '10:00 AM - 5:00 PM' },
            { day: 'Monday', time: 'Closed' }
        ];

        operatingHours.forEach(schedule => {
            const scheduleRow = document.createElement('div');
            scheduleRow.style.display = 'flex';
            scheduleRow.style.justifyContent = 'space-between';
            scheduleRow.style.padding = '8px 0';
            scheduleRow.style.borderBottom = '1px solid #e0e4e9';

            const daySpan = document.createElement('span');
            daySpan.style.fontWeight = 'bold';
            daySpan.textContent = schedule.day;

            const timeSpan = document.createElement('span');
            timeSpan.style.color = schedule.time === 'Closed' ? '#dc3545' : '#2962ff';
            timeSpan.textContent = schedule.time;

            scheduleRow.appendChild(daySpan);
            scheduleRow.appendChild(timeSpan);
            content.appendChild(scheduleRow);
        });

        return content;
    }

    function createTimingsAdditionalInfo() {
        const additionalInfo = document.createElement('div');
        additionalInfo.style.marginTop = '15px';
        additionalInfo.style.padding = '10px';
        additionalInfo.style.background = '#e9ecef';
        additionalInfo.style.borderRadius = '8px';
        additionalInfo.style.fontSize = '0.9em';

        const infoPoints = [
            "🎟️ Last entry 30 minutes before closing",
            "🎯 Guided tours available every 2 hours",
            "📅 Open on all public holidays except national holidays",
            "⚡ Special exhibitions may have different timings"
        ];

        infoPoints.forEach(info => {
            const infoLine = document.createElement('div');
            infoLine.style.marginBottom = '8px';
            infoLine.textContent = info;
            additionalInfo.appendChild(infoLine);
        });

        return additionalInfo;
    }

    // QA Data & Handlers
    const qaData = {
        categories: [
            {
                name: "General Information",
                icon: "ℹ️",
                questions: [
                    {
                        q: "Do you have wheelchair accessibility?",
                        a: "Yes, all our museums are wheelchair accessible with ramps and elevators. We also provide complimentary wheelchairs at the entrance desk."
                    },
                    {
                        q: "Are photography/videos allowed?",
                        a: "Photography is allowed in most areas without flash. Some special exhibitions may have restrictions. Video recording needs prior permission."
                    },
                    {
                        q: "Do you have guided tours?",
                        a: "Yes, we offer guided tours at 10 AM, 2 PM, and 4 PM daily. Tours are available in multiple languages and can be booked in advance."
                    }
                ]
            },
            {
                name: "Facilities & Services",
                icon: "🏛️",
                questions: [
                    {
                        q: "Is there a cafeteria/restaurant?",
                        a: "Yes, we have a cafeteria serving snacks and beverages. We also have a restaurant offering local and international cuisine."
                    },
                    {
                        q: "Do you have lockers/storage?",
                        a: "Yes, we provide secure lockers for storing personal belongings. They're available for a small fee at the entrance."
                    },
                    {
                        q: "Is parking available?",
                        a: "Yes, we have both regular and disabled parking facilities. Parking is free for museum visitors."
                    }
                ]
            },
            {
                name: "Special Arrangements",
                icon: "👥",
                questions: [
                    {
                        q: "Can I arrange a school visit?",
                        a: "Yes, we offer special educational programs for schools. Please contact us at least one week in advance to arrange a visit."
                    },
                    {
                        q: "Do you host private events?",
                        a: "Yes, certain areas of the museum can be booked for private events. Please contact our events team for details."
                    },
                    {
                        q: "Are there special programs for children?",
                        a: "Yes, we offer various workshops, guided tours, and interactive sessions specifically designed for children."
                    }
                ]
            }
        ]
    };

    function createQACategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'qa-category-card';
        card.style.background = 'white';
        card.style.padding = '15px';
        card.style.borderRadius = '12px';
        card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        card.style.cursor = 'pointer';

        const header = document.createElement('div');
        header.style.fontSize = '1.1em';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '8px';
        header.style.color = '#2962ff';
        header.innerHTML = `${category.icon} ${category.name}`;

        const description = document.createElement('div');
        description.style.fontSize = '0.85em';
        description.style.color = '#666';
        description.textContent = `${category.questions.length} common questions`;

        card.appendChild(header);
        card.appendChild(description);
        card.onclick = () => showQuestions(category);
        return card;
    }

    async function handleQuestions() {
        await sendTypingMessage("What would you like to know more about? Choose a category or type your question:");

        const categoriesContainer = document.createElement('div');
        categoriesContainer.style.display = 'grid';
        categoriesContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        categoriesContainer.style.gap = '10px';
        categoriesContainer.style.padding = '10px 0';

        qaData.categories.forEach(category => {
            const categoryCard = createQACategoryCard(category);
            categoriesContainer.appendChild(categoryCard);
        });

        chatMessages.appendChild(categoriesContainer);
        await sendTypingMessage("Or you can type your question directly, and I'll help you find the answer! 🔍");
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function showQuestions(category) {
        await sendTypingMessage(`Here are common questions about ${category.name}:`);

        const questionsContainer = document.createElement('div');
        questionsContainer.style.padding = '10px 0';
        questionsContainer.style.display = 'flex';
        questionsContainer.style.flexDirection = 'column';
        questionsContainer.style.gap = '8px';

        category.questions.forEach(qa => {
            const questionBtn = document.createElement('button');
            questionBtn.className = 'option-btn';
            questionBtn.style.textAlign = 'left';
            questionBtn.style.width = '100%';
            questionBtn.innerHTML = `❓ ${qa.q}`;
            questionBtn.onclick = () => showAnswer(qa);
            questionsContainer.appendChild(questionBtn);
        });

        const backBtn = document.createElement('button');
        backBtn.className = 'option-btn';
        backBtn.style.marginTop = '10px';
        backBtn.style.background = '#2962ff';
        backBtn.style.color = 'white';
        backBtn.textContent = '← Back to Categories';
        backBtn.onclick = handleQuestions;

        questionsContainer.appendChild(backBtn);
        chatMessages.appendChild(questionsContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function showAnswer(qa) {
        addMessage(qa.q, true);
        await sendTypingMessage(qa.a);

        const followUpContainer = document.createElement('div');
        followUpContainer.style.marginTop = '10px';
        followUpContainer.style.display = 'flex';
        followUpContainer.style.flexDirection = 'column';
        followUpContainer.style.gap = '8px';

        if (qa.q.toLowerCase().includes('guided tour')) {
            const bookTourBtn = document.createElement('button');
            bookTourBtn.className = 'option-btn';
            bookTourBtn.style.background = '#2962ff';
            bookTourBtn.style.color = 'white';
            bookTourBtn.textContent = '🎫 Book a Tour';
            bookTourBtn.onclick = () => handleOptionClick('booking');
            followUpContainer.appendChild(bookTourBtn);
        }

        const askMoreBtn = document.createElement('button');
        askMoreBtn.className = 'option-btn';
        askMoreBtn.textContent = '❓ Ask Another Question';
        askMoreBtn.onclick = handleQuestions;
        followUpContainer.appendChild(askMoreBtn);

        chatMessages.appendChild(followUpContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function searchQuestions(query) {
        const results = [];
        const normalizedQuery = query.toLowerCase();

        qaData.categories.forEach(category => {
            category.questions.forEach(qa => {
                if (qa.q.toLowerCase().includes(normalizedQuery) ||
                    qa.a.toLowerCase().includes(normalizedQuery)) {
                    results.push(qa);
                }
            });
        });

        return results;
    }

    async function handleQuestionSearch(input) {
        const results = searchQuestions(input);

        if (results.length > 0) {
            await sendTypingMessage("I found these relevant questions:");

            const resultsContainer = document.createElement('div');
            resultsContainer.style.padding = '10px 0';
            resultsContainer.style.display = 'flex';
            resultsContainer.style.flexDirection = 'column';
            resultsContainer.style.gap = '8px';

            results.forEach(qa => {
                const questionBtn = document.createElement('button');
                questionBtn.className = 'option-btn';
                questionBtn.style.textAlign = 'left';
                questionBtn.innerHTML = `❓ ${qa.q}`;
                questionBtn.onclick = () => showAnswer(qa);
                resultsContainer.appendChild(questionBtn);
            });

            chatMessages.appendChild(resultsContainer);
        } else {
            await sendTypingMessage("I'm not sure about that. Here are some common questions that might help:");
            await handleQuestions();
        }
    }

    // Collections Data & Handlers
    const collectionData = {
        "Ancient History": {
            description: "Journey through time with our extensive Ancient History collection.",
            subcategories: {
                "Prehistoric Era": {
                    items: ["Stone Age Tools", "Early Human Artifacts", "Cave Art Replicas"],
                    description: "Discover the origins of human civilization through artifacts dating back millions of years."
                },
                "Ancient Civilizations": {
                    items: ["Egyptian Artifacts", "Greek Pottery", "Roman Sculptures"],
                    description: "Explore the rich cultural heritage of the world's greatest ancient civilizations."
                },
                "Medieval Period": {
                    items: ["Knight Armor", "Ancient Manuscripts", "Royal Artifacts"],
                    description: "Experience the medieval world through authentic pieces from various kingdoms."
                }
            }
        },
        "Modern Art": {
            description: "Experience the evolution of artistic expression through our modern art collection.",
            subcategories: {
                "Contemporary Paintings": {
                    items: ["Abstract Expressionism", "Pop Art", "Minimalist Works"],
                    description: "Explore groundbreaking works from the 20th and 21st centuries."
                },
                "Digital Art": {
                    items: ["Interactive Installations", "Digital Photography", "New Media Art"],
                    description: "Discover how technology is reshaping artistic expression."
                },
                "Sculptures": {
                    items: ["Metal Works", "Glass Art", "Mixed Media Installations"],
                    description: "Experience three-dimensional art that challenges traditional perspectives."
                }
            }
        },
        "Natural History": {
            description: "Discover the wonders of our natural world.",
            subcategories: {
                "Geology": {
                    items: ["Mineral Collection", "Fossil Specimens", "Rock Formations"],
                    description: "Explore Earth's history through our extensive geological collection."
                },
                "Flora & Fauna": {
                    items: ["Preserved Specimens", "Biodiversity Exhibits", "Ecosystem Dioramas"],
                    description: "Learn about the diverse life forms that inhabit our planet."
                },
                "Evolution": {
                    items: ["Human Evolution", "Species Adaptation", "Genetic Diversity"],
                    description: "Understand the journey of life through evolutionary exhibits."
                }
            }
        },
        "Special Exhibitions": {
            description: "Explore our rotating collection of unique and limited-time exhibitions.",
            subcategories: {
                "Current Exhibits": {
                    items: ["Featured Artists", "Themed Collections", "Interactive Displays"],
                    description: "Experience our latest special exhibitions and featured collections."
                },
                "Upcoming Shows": {
                    items: ["Preview Galleries", "Artist Spotlights", "Exhibition Calendar"],
                    description: "Get a sneak peek at our upcoming exhibitions and events."
                },
                "Virtual Tours": {
                    items: ["3D Gallery Tours", "Online Exhibitions", "Digital Collections"],
                    description: "Explore our collections from anywhere in the world."
                }
            }
        }
    };

    function getCollectionIcon(category) {
        const icons = {
            "Ancient History": "🏺",
            "Modern Art": "🎨",
            "Natural History": "🦕",
            "Special Exhibitions": "✨"
        };
        return icons[category] || "📚";
    }

    async function handleCollections() {
        await sendTypingMessage("Our museums house several fascinating collections. What interests you the most?");

        const categoriesContainer = document.createElement('div');
        categoriesContainer.style.display = 'grid';
        categoriesContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        categoriesContainer.style.gap = '10px';
        categoriesContainer.style.padding = '10px 0';

        Object.entries(collectionData).forEach(([category, data]) => {
            const card = createCategoryCard(category, data);
            categoriesContainer.appendChild(card);
        });

        chatMessages.appendChild(categoriesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createCategoryCard(category, data) {
        const card = document.createElement('div');
        card.className = 'collection-card';
        card.style.background = 'white';
        card.style.padding = '15px';
        card.style.borderRadius = '12px';
        card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        card.style.cursor = 'pointer';

        const icon = getCollectionIcon(category);
        const title = document.createElement('div');
        title.style.fontSize = '1.1em';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        title.style.color = '#2962ff';
        title.innerHTML = `${icon} ${category}`;

        const description = document.createElement('div');
        description.style.fontSize = '0.85em';
        description.style.color = '#666';
        description.textContent = data.description;

        card.appendChild(title);
        card.appendChild(description);
        card.onclick = () => showSubcategories(category, data.subcategories);
        return card;
    }

    async function showSubcategories(category, subcategories) {
        await sendTypingMessage(`Let's explore our ${category} collection. What would you like to learn more about?`);

        const subcategoriesContainer = document.createElement('div');
        subcategoriesContainer.style.display = 'grid';
        subcategoriesContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        subcategoriesContainer.style.gap = '10px';
        subcategoriesContainer.style.padding = '10px 0';

        Object.entries(subcategories).forEach(([subName, subData]) => {
            const subCard = createSubcategoryCard(subName, subData);
            subcategoriesContainer.appendChild(subCard);
        });

        chatMessages.appendChild(subcategoriesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createSubcategoryCard(subName, subData) {
        const card = document.createElement('div');
        card.className = 'subcategory-card';
        card.style.background = '#f8f9fa';
        card.style.padding = '12px';
        card.style.borderRadius = '10px';
        card.style.border = '2px solid #2962ff';
        card.style.cursor = 'pointer';

        const title = document.createElement('div');
        title.style.fontSize = '1em';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '6px';
        title.style.color = '#2962ff';
        title.textContent = subName;

        const description = document.createElement('div');
        description.style.fontSize = '0.85em';
        description.style.color = '#555';
        description.textContent = subData.description;

        card.appendChild(title);
        card.appendChild(description);
        card.onclick = () => showItems(subName, subData.items);
        return card;
    }

    async function showItems(subName, items) {
        await sendTypingMessage(`Here are the highlights from our ${subName} collection:`);

        const itemsContainer = document.createElement('div');
        itemsContainer.style.background = 'white';
        itemsContainer.style.padding = '15px';
        itemsContainer.style.borderRadius = '12px';
        itemsContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        itemsContainer.style.margin = '10px 0';

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.style.padding = '8px 0';
            itemElement.style.borderBottom = '1px solid #e0e4e9';
            itemElement.style.display = 'flex';
            itemElement.style.alignItems = 'center';
            itemElement.innerHTML = `<span style="margin-right: 10px; font-size: 1.1em;">🔍</span> <span>${item}</span>`;
            itemsContainer.appendChild(itemElement);
        });

        const learnMoreBtn = document.createElement('button');
        learnMoreBtn.className = 'option-btn';
        learnMoreBtn.style.background = '#2962ff';
        learnMoreBtn.style.color = 'white';
        learnMoreBtn.style.padding = '10px 20px';
        learnMoreBtn.style.marginTop = '15px';
        learnMoreBtn.style.width = '100%';
        learnMoreBtn.textContent = 'Learn More About This Collection';
        learnMoreBtn.onclick = () => handleLearnMore(subName);

        itemsContainer.appendChild(learnMoreBtn);
        chatMessages.appendChild(itemsContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleLearnMore(subName) {
        await sendTypingMessage("Would you like to:");

        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexDirection = 'column';
        optionsContainer.style.gap = '8px';
        optionsContainer.style.padding = '10px 0';

        const subOptions = [
            { text: "🎫 Book a guided tour", action: "tour" },
            { text: "📱 Access digital catalog", action: "catalog" },
            { text: "👥 Join upcoming events", action: "events" },
            { text: "❓ Ask specific questions", action: "questions" }
        ];

        subOptions.forEach(opt => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.style.textAlign = 'left';
            button.textContent = opt.text;
            button.onclick = () => handleLearnMoreOption(opt.action, subName);
            optionsContainer.appendChild(button);
        });

        chatMessages.appendChild(optionsContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleLearnMoreOption(action, subName) {
        const respMap = {
            tour: `I can help you book a guided tour of our ${subName} collection. Our expert guides provide tours at 10 AM, 2 PM, and 4 PM daily.`,
            catalog: `You can access our digital catalog of the ${subName} collection through our museum app or website.`,
            events: `We have several upcoming events related to ${subName}! These include workshops, lectures, and special exhibitions.`,
            questions: `Feel free to ask any specific questions about our ${subName} collection. Our chatbot is knowledgeable about all items in this collection.`
        };

        await sendTypingMessage(respMap[action]);

        const followUpContainer = document.createElement('div');
        followUpContainer.style.marginTop = '10px';
        followUpContainer.style.display = 'flex';
        followUpContainer.style.flexDirection = 'column';
        followUpContainer.style.gap = '8px';

        if (action === 'tour') {
            const bookTourBtn = document.createElement('button');
            bookTourBtn.className = 'option-btn';
            bookTourBtn.style.background = '#2962ff';
            bookTourBtn.style.color = 'white';
            bookTourBtn.textContent = '📅 Book Tour Now';
            bookTourBtn.onclick = () => handleOptionClick('booking');
            followUpContainer.appendChild(bookTourBtn);
        }

        const backBtn = document.createElement('button');
        backBtn.className = 'option-btn';
        backBtn.textContent = '← Back to Collections';
        backBtn.onclick = handleCollections;
        followUpContainer.appendChild(backBtn);

        chatMessages.appendChild(followUpContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
})();
