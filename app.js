// app.js - 修复版本
const SUPABASE_URL = 'https://qxdravwmyllgkikbloza.supabase.co'; // 替换为你的 Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZHJhdndteWxsZ2tpa2Jsb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDk1NDksImV4cCI6MjA3NjU4NTU0OX0.p6kKj-ILhfjw1WG203fBYKxg2hFh4bOfp4CPsh6B7Jw'; // 替换为你的 anon key

// 初始化 Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 检查用户登录状态
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    updateUI(session);
    return session;
}

// 更新 UI 显示
function updateUI(session) {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const pasteForm = document.getElementById('paste-form');

    if (session && session.user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (dashboardBtn) dashboardBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userInfo) userInfo.textContent = `欢迎, ${session.user.email}`;
        if (pasteForm) pasteForm.style.display = 'flex';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (dashboardBtn) dashboardBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userInfo) userInfo.textContent = '';
        if (pasteForm) pasteForm.style.display = 'none';
    }
}

// 退出登录
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = 'index.html';
    }
}

// 创建新的剪贴
async function createPaste(title, content, status) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        alert('请先登录');
        return false;
    }

    const { data, error } = await supabase
        .from('submissions')
        .insert([
            {
                title: title || '无标题',
                content: content,
                status: status,
                user_id: session.user.id
            }
        ])
        .select();

    if (error) {
        console.error('Error creating paste:', error);
        alert('创建失败: ' + error.message);
        return false;
    } else {
        alert('剪贴已保存!');
        if (document.getElementById('paste-form')) {
            document.getElementById('paste-form').reset();
        }
        return data[0];
    }
}

// 获取公开剪贴
async function getPublicPastes() {
    const { data, error } = await supabase
        .from('submissions')
        .select(`
            *,
            users:user_id (username)
        `)
        .eq('status', 'public')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching pastes:', error);
        return [];
    }

    return data || [];
}

// 显示公开剪贴
function displayPublicPastes(pastes) {
    const container = document.getElementById('public-pastes-list');
    if (!container) return;

    if (!pastes || pastes.length === 0) {
        container.innerHTML = '<p>暂无公开剪贴</p>';
        return;
    }

    container.innerHTML = pastes.map(paste => `
        <div class="paste-item">
            <h3>${paste.title}</h3>
            <div class="paste-content">${paste.content}</div>
            <div class="paste-meta">
                作者: ${paste.users?.username || '匿名'} | 
                创建时间: ${new Date(paste.created_at).toLocaleString()} |
                状态: ${paste.status === 'public' ? '公开' : '私有'}
            </div>
        </div>
    `).join('');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    
    // 如果是首页，加载公开剪贴
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const publicPastes = await getPublicPastes();
        displayPublicPastes(publicPastes);

        // 处理表单提交
        const pasteForm = document.getElementById('paste-form');
        if (pasteForm) {
            pasteForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const title = document.getElementById('title').value;
                const content = document.getElementById('content').value;
                const status = document.getElementById('status').value;

                if (!content.trim()) {
                    alert('请输入内容');
                    return;
                }

                const success = await createPaste(title, content, status);
                
                if (success) {
                    // 刷新公开剪贴列表
                    const publicPastes = await getPublicPastes();
                    displayPublicPastes(publicPastes);
                }
            });
        }
    }
});
