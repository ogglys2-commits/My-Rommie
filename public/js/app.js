let currentPair = null;
let activeUser = '';
let currentTxType = 'expense';
let transactions = [];

function initApp() {
  const savedPair = localStorage.getItem('myroomie_pair_data');
  if (savedPair) {
    currentPair = JSON.parse(savedPair);
    loadPairDashboard();
  } else {
    document.getElementById('authModal').style.display = 'flex';
  }

  document.getElementById('txAmount').addEventListener('input', updateConvertedPreview);
  document.getElementById('txDate').valueAsDate = new Date();
  lucide.createIcons();
}

function showAuthTab(tab) {
  if (tab === 'login') {
    document.getElementById('formLogin').classList.remove('hidden');
    document.getElementById('formRegister').classList.add('hidden');
    document.getElementById('tabLogin').className = "w-1/2 py-2 text-xs font-bold rounded-lg bg-white text-slateWarm-700 shadow-sm transition-all";
    document.getElementById('tabRegister').className = "w-1/2 py-2 text-xs font-bold rounded-lg text-gray-500 transition-all";
  } else {
    document.getElementById('formRegister').classList.remove('hidden');
    document.getElementById('formLogin').classList.add('hidden');
    document.getElementById('tabRegister').className = "w-1/2 py-2 text-xs font-bold rounded-lg bg-white text-slateWarm-700 shadow-sm transition-all";
    document.getElementById('tabLogin').className = "w-1/2 py-2 text-xs font-bold rounded-lg text-gray-500 transition-all";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const pairId = document.getElementById('regPairId').value;
  const user1 = document.getElementById('regUser1').value;
  const user2 = document.getElementById('regUser2').value;
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId, user1, user2, password })
    });
    const data = await res.json();

    if (res.ok) {
      showToast('¡Pareja registrada con éxito!');
      showAuthTab('login');
      document.getElementById('loginPairId').value = pairId;
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Error de conexión con el servidor', 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const pairId = document.getElementById('loginPairId').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId, password })
    });
    const data = await res.json();

    if (res.ok) {
      currentPair = data.pair;
      localStorage.setItem('myroomie_pair_data', JSON.stringify(currentPair));
      localStorage.setItem('myroomie_token', data.token);
      loadPairDashboard();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Error de servidor al iniciar sesión', 'error');
  }
}

function loadPairDashboard() {
  document.getElementById('authModal').style.display = 'none';
  activeUser = currentPair.user1;

  document.getElementById('headerPairName').innerText = `Pareja: ${currentPair.user1} & ${currentPair.user2}`;
  document.getElementById('propUser1Name').innerText = currentPair.user1;
  document.getElementById('propUser2Name').innerText = currentPair.user2;

  const switcher = document.getElementById('userSwitchContainer');
  switcher.innerHTML = `
      <button id="btnUser1" onclick="switchUser('${currentPair.user1}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slateWarm-700 shadow-sm">${currentPair.user1}</button>
      <button id="btnUser2" onclick="switchUser('${currentPair.user2}')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500">${currentPair.user2}</button>
  `;

  switchUser(currentPair.user1);
  fetchTransactions();
}

function logout() {
  localStorage.removeItem('myroomie_pair_data');
  localStorage.removeItem('myroomie_token');
  location.reload();
}

function switchUser(user) {
  activeUser = user;
  document.getElementById('activeUserLabel').innerText = user;
  document.querySelectorAll('.currentUserSpan').forEach(el => el.innerText = user);

  const btn1 = document.getElementById('btnUser1');
  const btn2 = document.getElementById('btnUser2');

  if (user === currentPair.user1) {
    btn1.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slateWarm-700 shadow-sm";
    btn2.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500";
  } else {
    btn2.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slateWarm-700 shadow-sm";
    btn1.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500";
  }
}

async function fetchTransactions() {
  try {
    const res = await fetch(`/api/transactions/${currentPair.pairId}`);
    transactions = await res.json();
    updateAllCalculations();
  } catch (err) {
    showToast('Error al obtener datos', 'error');
  }
}

function updateConvertedPreview() {
  const amount = parseFloat(document.getElementById('txAmount').value) || 0;
  const curr = document.getElementById('txCurrency').value;
  const rate = parseFloat(document.getElementById('exchangeRate').value) || 36.5;
  const preview = document.getElementById('currencyConvertedPreview');

  if (curr === 'BS') {
    preview.innerText = `Equivalente en USD: $${(amount / rate).toFixed(2)} (Tasa: ${rate} Bs/$)`;
  } else {
    preview.innerText = `Equivalente en Bs: Bs. ${(amount * rate).toFixed(2)} (Tasa: ${rate} Bs/$)`;
  }
}

function setTransactionType(type) {
  currentTxType = type;
  const btnExpense = document.getElementById('btnTypeExpense');
  const btnIncome = document.getElementById('btnTypeIncome');

  if (type === 'expense') {
    btnExpense.className = "py-2 text-xs font-bold rounded-xl border bg-coralSoft text-coralAlert border-coralAlert transition-all";
    btnIncome.className = "py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-500 hover:border-sage-500 transition-all";
  } else {
    btnIncome.className = "py-2 text-xs font-bold rounded-xl border bg-sage-50 text-sage-700 border-sage-500 transition-all";
    btnExpense.className = "py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-500 hover:border-coralAlert transition-all";
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const description = document.getElementById('txDescription').value.trim();
  const rawAmount = parseFloat(document.getElementById('txAmount').value);
  const currency = document.getElementById('txCurrency').value;
  const rate = parseFloat(document.getElementById('exchangeRate').value) || 36.5;
  const date = document.getElementById('txDate').value;
  const scope = document.getElementById('txScope').value;
  const week = document.getElementById('txWeek').value;
  const category = document.getElementById('txCategory').value;

  if (!description || isNaN(rawAmount) || rawAmount <= 0) return;

  const amountUSD = currency === 'BS' ? (rawAmount / rate) : rawAmount;

  const payload = {
    pairId: currentPair.pairId,
    user: activeUser,
    type: currentTxType,
    scope: scope,
    week: week,
    description: description,
    rawAmount: rawAmount,
    currency: currency,
    amountUSD: amountUSD,
    exchangeRate: rate,
    date: date,
    category: category
  };

  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Guardado en la Base de Datos');
      document.getElementById('transactionForm').reset();
      document.getElementById('txDate').valueAsDate = new Date();
      fetchTransactions();
    }
  } catch (err) {
    showToast('Error al guardar registro', 'error');
  }
}

async function deleteTransaction(id) {
  try {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Registro eliminado');
      fetchTransactions();
    }
  } catch (err) {
    showToast('Error al eliminar', 'error');
  }
}

async function clearAllData() {
  if (confirm('¿Restablecer movimientos de esta pareja?')) {
    try {
      await fetch(`/api/transactions/clear/${currentPair.pairId}`, { method: 'DELETE' });
      showToast('Datos reiniciados');
      fetchTransactions();
    } catch (err) {
      showToast('Error al reiniciar', 'error');
    }
  }
}

function updateAllCalculations() {
  const rate = parseFloat(document.getElementById('exchangeRate').value) || 36.5;

  let totalIncome = 0;
  let totalExpenses = 0;
  let user1Income = 0;
  let user2Income = 0;
  let sharedExpenses = 0;

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amountUSD;
      if (t.user === currentPair.user1) user1Income += t.amountUSD;
      if (t.user === currentPair.user2) user2Income += t.amountUSD;
    }
    if (t.type === 'expense') {
      totalExpenses += t.amountUSD;
      if (t.scope === 'Pareja') sharedExpenses += t.amountUSD;
    }
  });

  const totalPairIncome = user1Income + user2Income;
  let u1Pct = totalPairIncome > 0 ? (user1Income / totalPairIncome) * 100 : 50;
  let u2Pct = totalPairIncome > 0 ? (user2Income / totalPairIncome) * 100 : 50;

  document.getElementById('propUser1Pct').innerText = `${u1Pct.toFixed(1)}%`;
  document.getElementById('propUser1Income').innerText = `$${user1Income.toFixed(2)}`;
  document.getElementById('propUser1Share').innerText = `$${(sharedExpenses * (u1Pct / 100)).toFixed(2)}`;

  document.getElementById('propUser2Pct').innerText = `${u2Pct.toFixed(1)}%`;
  document.getElementById('propUser2Income').innerText = `$${user2Income.toFixed(2)}`;
  document.getElementById('propUser2Share').innerText = `$${(sharedExpenses * (u2Pct / 100)).toFixed(2)}`;

  document.getElementById('propTotalIncome').innerText = `$${totalPairIncome.toFixed(2)}`;
  document.getElementById('propTotalExpenses').innerText = `$${sharedExpenses.toFixed(2)}`;

  const balance = totalIncome - totalExpenses;

  document.getElementById('kpiIncome').innerText = `$${totalIncome.toFixed(2)}`;
  document.getElementById('kpiIncomeBs').innerText = `Bs. ${(totalIncome * rate).toLocaleString('es-VE', {minimumFractionDigits: 2})}`;

  document.getElementById('kpiExpenses').innerText = `$${totalExpenses.toFixed(2)}`;
  document.getElementById('kpiExpensesBs').innerText = `Bs. ${(totalExpenses * rate).toLocaleString('es-VE', {minimumFractionDigits: 2})}`;

  document.getElementById('kpiBalance').innerText = `$${balance.toFixed(2)}`;
  document.getElementById('kpiBalanceBs').innerText = `Bs. ${(balance * rate).toLocaleString('es-VE', {minimumFractionDigits: 2})}`;

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('transactionTableBody');
  document.getElementById('txCount').innerText = `${transactions.length} Registros`;

  if (transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-400">Sin movimientos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(t => `
      <tr class="hover:bg-gray-50/80 transition-colors">
          <td class="py-3 px-3">
              <div class="font-bold text-slateWarm-700">${t.description}</div>
              <div class="text-[10px] text-gray-400">${t.date} • ${t.category}</div>
          </td>
          <td class="py-3 px-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${t.scope === 'Pareja' ? 'bg-slateWarm-100 text-slateWarm-700' : 'bg-sage-100 text-sage-700'}">
                  ${t.user}
              </span>
          </td>
          <td class="py-3 px-3 font-semibold text-slateWarm-600">
              ${t.currency === 'BS' ? 'Bs. ' + t.rawAmount.toFixed(2) : '$' + t.rawAmount.toFixed(2)}
          </td>
          <td class="py-3 px-3 font-bold ${t.type === 'income' ? 'text-sage-600' : 'text-coralAlert'}">
              ${t.type === 'income' ? '+' : '-'}$${t.amountUSD.toFixed(2)}
          </td>
          <td class="py-3 px-3 text-right">
              <button onclick="deleteTransaction('${t._id}')" class="text-gray-300 hover:text-coralAlert p-1">
                  <i data-lucide="trash" class="w-4 h-4"></i>
              </button>
          </td>
      </tr>
  `).join('');
  lucide.createIcons();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  let bg = type === 'error' ? 'bg-red-600 text-white' : 'bg-slateWarm-700 text-white';

  toast.className = `px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all ${bg}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

window.onload = initApp;