document.addEventListener('DOMContentLoaded', () => {
    const amountRadios = document.querySelectorAll('input[name="amount"]');
    const customAmountWrapper = document.getElementById('custom-amount-wrapper');
    const customAmountInput = document.getElementById('custom-amount');
    const form = document.getElementById('donation-form');
    
    // Payment method buttons logic (for styling/selection)
    const payBtns = document.querySelectorAll('.pay-btn');
    let selectedPayment = 'Crypto'; // default

    payBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active style from all
            payBtns.forEach(b => {
                b.style.borderColor = 'var(--card-border)';
                b.style.background = 'rgba(255, 255, 255, 0.05)';
            });
            // Add active style to clicked
            btn.style.borderColor = 'var(--primary)';
            btn.style.background = 'rgba(99, 102, 241, 0.1)';
            
            selectedPayment = btn.classList.contains('crypto') ? 'Crypto' : 'PayPal';
        });
    });

    // Initialize the first button as selected
    if(payBtns.length > 0) {
        payBtns[0].click();
    }

    // Amount Selection logic
    amountRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customAmountWrapper.classList.remove('hidden');
                customAmountInput.focus();
            } else {
                customAmountWrapper.classList.add('hidden');
                customAmountInput.value = '';
            }
        });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedAmount = document.querySelector('input[name="amount"]:checked').value;
        let finalAmount = selectedAmount;
        
        if (selectedAmount === 'custom') {
            finalAmount = customAmountInput.value;
            if (!finalAmount || finalAmount <= 0) {
                alert('ກະລຸນາປ້ອນຈຳນວນເງິນທີ່ຖືກຕ້ອງ (Please enter a valid amount)');
                return;
            }
        }
        
        const message = document.querySelector('textarea').value;
        
        // Construct WhatsApp Message
        let waText = "ຂ້ອຍຕ້ອງການ ສະໜັບສະໜູນ ຂໍຂໍ້ມູນການຊຳລະເງິນແດ່";
        waText += `\n- ຈຳນວນ: $${finalAmount}\n- ຊ່ອງທາງ: ${selectedPayment}`;
        if (message) {
            waText += `\n- ຂໍ້ຄວາມ: ${message}`;
        }
        
        const waUrl = `https://wa.me/8562091116465?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
    });
});
