// 英文学习助手 - 主要JavaScript功能

// 工具函数 - 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 工具函数 - 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 工具函数 - 根据难度获取颜色和类名
function getDifficultyInfo(difficulty) {
    switch (difficulty) {
        case 'hard':
            return {
                className: 'difficulty-hard',
                text: '困难',
                color: 'text-danger'
            };
        case 'medium':
            return {
                className: 'difficulty-medium',
                text: '中等',
                color: 'text-warning'
            };
        case 'easy':
            return {
                className: 'difficulty-easy',
                text: '简单',
                color: 'text-info'
            };
        default:
            return {
                className: '',
                text: '未知',
                color: 'text-secondary'
            };
    }
}

// 主题管理类
class ThemeManager {
    constructor() {
        this.body = document.body;
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.themeIcon = this.themeToggleBtn.querySelector('i');
        this.darkModeClass = 'dark-mode';
        this.storageKey = 'englishAppDarkMode';

        // 初始化主题
        this.initTheme();
        this.bindEvents();
    }

    initTheme() {
        // 从本地存储中读取主题设置
        const isDarkMode = localStorage.getItem(this.storageKey) === 'true';

        // 如果首选项是暗色模式或本地存储有记录，则应用暗色模式
        if (isDarkMode || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.enableDarkMode();
        } else {
            this.enableLightMode();
        }
    }

    bindEvents() {
        // 点击主题切换按钮
        this.themeToggleBtn.addEventListener('click', () => {
            if (this.body.classList.contains(this.darkModeClass)) {
                this.enableLightMode();
            } else {
                this.enableDarkMode();
            }
        });

        // 监听系统主题变化
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.enableLightMode();
                }
            });
        }
    }

    enableDarkMode() {
        this.body.classList.add(this.darkModeClass);
        this.themeIcon.className = 'fas fa-sun';
        localStorage.setItem(this.storageKey, 'true');
    }

    enableLightMode() {
        this.body.classList.remove(this.darkModeClass);
        this.themeIcon.className = 'fas fa-moon';
        localStorage.setItem(this.storageKey, 'false');
    }
}

// 主应用类
class EnglishApp {
    constructor() {
        // 初始化状态
        this.items = [];
        this.editingItemId = null;
        this.itemsPerPage = 10; // 每页显示10项
        this.currentPage = 1; // 当前页码，从1开始

        // DOM 元素
        this.form = $('#english-form');
        this.englishInput = $('#english-input');
        this.notesInput = $('#notes-input');
        this.itemsContainer = $('#english-items');
        this.noItemsMessage = $('#no-items-message');
        this.searchInput = $('#search-input');
        this.clearAllBtn = $('#clear-all');
        this.filterChecks = $('.filter-check');

        // 分页元素
        this.paginationControls = $('#pagination-controls');
        this.paginationStart = $('#pagination-start');
        this.paginationEnd = $('#pagination-end');
        this.paginationTotal = $('#pagination-total');

        // 编辑模态框
        this.editModal = new bootstrap.Modal(document.getElementById('editModal'));
        this.editForm = $('#edit-form');
        this.editIdInput = $('#edit-id');
        this.editEnglishInput = $('#edit-english');
        this.editNotesInput = $('#edit-notes');
        this.saveEditBtn = $('#save-edit');

        // 初始化
        this.loadItems();
        this.renderItems();
        this.bindEvents();

        // 页面滚动动画
        this.initScrollAnimation();
    }

    // 初始化滚动动画
    initScrollAnimation() {
        $(window).scroll(this.handleScroll);
        // 初始触发一次
        this.handleScroll();
    }

    // 处理滚动事件
    handleScroll = () => {
        const scrollTop = $(window).scrollTop();
        const windowHeight = $(window).height();

        // 为视口中的元素添加动画
        $('.bg-light, .table-responsive').each(function () {
            const elementTop = $(this).offset().top;
            const elementHeight = $(this).height();

            // 元素是否在视口中
            if (elementTop < scrollTop + windowHeight && elementTop + elementHeight > scrollTop) {
                if (!$(this).hasClass('animated')) {
                    $(this).addClass('animated');
                    $(this).css('opacity', '0').animate({
                        opacity: 1,
                        transform: 'translateY(0)'
                    }, 600);
                }
            }
        });
    }

    // 绑定事件监听器
    bindEvents() {
        // 提交表单
        this.form.on('submit', (e) => {
            e.preventDefault();
            this.addItem();
        });

        // 搜索
        this.searchInput.on('input', () => {
            this.currentPage = 1; // 重置为第一页
            this.renderItems();
        });

        // 过滤
        this.filterChecks.on('change', () => {
            this.currentPage = 1; // 重置为第一页
            this.renderItems();
        });

        // 清空所有数据
        this.clearAllBtn.on('click', () => {
            if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
                this.clearAllItems();
            }
        });

        // 保存编辑
        this.saveEditBtn.on('click', () => {
            this.saveEdit();
        });

        // 删除项目的事件委托
        this.itemsContainer.on('click', '.delete-item', (e) => {
            const id = $(e.currentTarget).data('id');
            if (confirm('确定要删除这个项目吗？')) {
                this.deleteItem(id);
            }
        });

        // 编辑项目的事件委托
        this.itemsContainer.on('click', '.edit-item', (e) => {
            const id = $(e.currentTarget).data('id');
            this.showEditModal(id);
        });

        // 分页按钮的事件委托
        this.paginationControls.on('click', '.page-link', (e) => {
            e.preventDefault();
            const pageAction = $(e.currentTarget).data('page');

            if (pageAction === 'prev') {
                this.goToPage(this.currentPage - 1);
            } else if (pageAction === 'next') {
                this.goToPage(this.currentPage + 1);
            } else if (typeof pageAction === 'number') {
                this.goToPage(pageAction);
            }
        });
    }

    // 从本地存储加载数据
    loadItems() {
        const storedItems = localStorage.getItem('englishItems');
        if (storedItems) {
            try {
                this.items = JSON.parse(storedItems);
            } catch (e) {
                console.error('加载数据失败:', e);
                this.items = [];
            }
        }
    }

    // 保存数据到本地存储
    saveItems() {
        localStorage.setItem('englishItems', JSON.stringify(this.items));
    }

    // 添加新项目
    addItem() {
        const english = this.englishInput.val().trim();
        const notes = this.notesInput.val().trim();
        const difficulty = $('input[name="difficulty"]:checked').val();

        if (!english || !difficulty) {
            alert('请输入英文内容并选择难度级别！');
            return;
        }

        const newItem = {
            id: generateId(),
            english,
            notes,
            difficulty,
            timestamp: Date.now()
        };

        this.items.unshift(newItem); // 添加到数组开头
        this.saveItems();
        this.currentPage = 1; // 添加新项目后跳转到第一页
        this.renderItems();

        // 重置表单
        this.form[0].reset();
        this.englishInput.focus();

        // 显示成功提示
        this.showNotification('添加成功！', 'success');
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = $(`
            <div class="notification notification-${type}">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                ${message}
            </div>
        `);

        // 添加到页面
        $('body').append(notification);

        // 显示动画
        setTimeout(() => {
            notification.addClass('show');
        }, 10);

        // 自动消失
        setTimeout(() => {
            notification.removeClass('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 删除项目
    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveItems();

        // 如果当前页没有数据了，尝试回到上一页
        const filteredItems = this.getFilteredItems();
        const totalPages = Math.ceil(filteredItems.length / this.itemsPerPage);
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        }

        this.renderItems();

        // 显示删除成功提示
        this.showNotification('删除成功！', 'success');
    }

    // 清空所有数据
    clearAllItems() {
        this.items = [];
        this.saveItems();
        this.currentPage = 1;
        this.renderItems();

        // 显示清空成功提示
        this.showNotification('已清空所有数据！', 'success');
    }

    // 显示编辑模态框
    showEditModal(id) {
        const item = this.items.find(item => item.id === id);
        if (!item) return;

        this.editingItemId = id;
        this.editEnglishInput.val(item.english);
        this.editNotesInput.val(item.notes);

        // 设置难度单选按钮
        $(`#edit-difficulty-${item.difficulty}`).prop('checked', true);

        this.editModal.show();
    }

    // 保存编辑
    saveEdit() {
        if (!this.editingItemId) return;

        const english = this.editEnglishInput.val().trim();
        const notes = this.editNotesInput.val().trim();
        const difficulty = $('input[name="edit-difficulty"]:checked').val();

        if (!english || !difficulty) {
            alert('请输入英文内容并选择难度级别！');
            return;
        }

        // 查找并更新项目
        const itemIndex = this.items.findIndex(item => item.id === this.editingItemId);
        if (itemIndex === -1) return;

        this.items[itemIndex] = {
            ...this.items[itemIndex],
            english,
            notes,
            difficulty
        };

        this.saveItems();
        this.renderItems();
        this.editModal.hide();
        this.editingItemId = null;

        // 显示编辑成功提示
        this.showNotification('编辑成功！', 'success');
    }

    // 获取当前过滤条件
    getActiveFilters() {
        return $('.filter-check:checked').map(function () {
            return $(this).val();
        }).get();
    }

    // 获取经过过滤的项目列表
    getFilteredItems() {
        // 获取搜索关键词和过滤条件
        const searchTerm = this.searchInput.val().trim().toLowerCase();
        const activeFilters = this.getActiveFilters();

        // 过滤项目
        return this.items.filter(item => {
            // 难度过滤
            if (!activeFilters.includes(item.difficulty)) {
                return false;
            }

            // 搜索过滤
            if (searchTerm) {
                return item.english.toLowerCase().includes(searchTerm) ||
                    (item.notes && item.notes.toLowerCase().includes(searchTerm));
            }

            return true;
        });
    }

    // 跳转到指定页面
    goToPage(pageNumber) {
        const filteredItems = this.getFilteredItems();
        const totalPages = Math.max(1, Math.ceil(filteredItems.length / this.itemsPerPage));

        // 确保页码在有效范围内
        if (pageNumber < 1) {
            pageNumber = 1;
        } else if (pageNumber > totalPages) {
            pageNumber = totalPages;
        }

        this.currentPage = pageNumber;
        this.renderItems();

        // 平滑滚动到表格顶部
        $('html, body').animate({
            scrollTop: $('.table-responsive').offset().top - 20
        }, 300);
    }

    // 渲染分页控件
    renderPagination(filteredItems) {
        const totalItems = filteredItems.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / this.itemsPerPage));

        // 计算当前页显示的项目范围
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, totalItems);

        // 更新分页信息
        this.paginationStart.text(totalItems > 0 ? startIndex + 1 : 0);
        this.paginationEnd.text(endIndex);
        this.paginationTotal.text(totalItems);

        // 清空分页控件
        this.paginationControls.empty();

        // 如果只有一页，不显示分页控件
        if (totalPages <= 1) {
            return;
        }

        // 添加"上一页"按钮
        const prevDisabled = this.currentPage === 1;
        const prevButton = $(`
            <li class="page-item ${prevDisabled ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="prev" aria-label="上一页">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `);
        this.paginationControls.append(prevButton);

        // 确定要显示的页码范围
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        // 调整范围，确保显示5个页码（如果有的话）
        if (endPage - startPage < 4 && totalPages > 4) {
            startPage = Math.max(1, endPage - 4);
        }

        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            const pageButton = $(`
                <li class="page-item ${isActive ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
            this.paginationControls.append(pageButton);
        }

        // 添加"下一页"按钮
        const nextDisabled = this.currentPage === totalPages;
        const nextButton = $(`
            <li class="page-item ${nextDisabled ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="next" aria-label="下一页">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `);
        this.paginationControls.append(nextButton);
    }

    // 渲染项目列表
    renderItems() {
        // 获取经过过滤的项目
        const filteredItems = this.getFilteredItems();

        // 渲染分页控件
        this.renderPagination(filteredItems);

        // 清空容器
        this.itemsContainer.empty();

        // 显示或隐藏"无数据"消息
        if (filteredItems.length === 0) {
            this.noItemsMessage.removeClass('d-none');
        } else {
            this.noItemsMessage.addClass('d-none');
        }

        // 计算当前页的项目
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, filteredItems.length);
        const currentPageItems = filteredItems.slice(startIndex, endIndex);

        // 渲染当前页的每个项目
        currentPageItems.forEach((item, index) => {
            const difficultyInfo = getDifficultyInfo(item.difficulty);

            const row = $(`
                <tr class="table-row fade-in">
                    <td>${startIndex + index + 1}</td>
                    <td>
                        <span class="difficulty-badge ${difficultyInfo.className}">
                            ${difficultyInfo.text}
                        </span>
                    </td>
                    <td class="english-content">${item.english}</td>
                    <td class="notes-content">${item.notes || '-'}</td>
                    <td>${formatDate(item.timestamp)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-action edit-item" data-id="${item.id}" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-action delete-item" data-id="${item.id}" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `);

            this.itemsContainer.append(row);
        });
    }
}

// 页面加载完成后初始化应用
$(document).ready(function () {
    // 添加通知样式
    const notificationStyles = `
        <style>
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border-radius: 8px;
                z-index: 9999;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                max-width: 300px;
            }
            .notification i {
                margin-right: 10px;
                font-size: 1.2rem;
            }
            .notification.show {
                opacity: 1;
                transform: translateY(0);
            }
            .notification-success {
                background: #d4edda;
                color: #155724;
                border-left: 4px solid #28a745;
            }
            .notification-info {
                background: #d1ecf1;
                color: #0c5460;
                border-left: 4px solid #17a2b8;
            }
            @media (prefers-color-scheme: dark) {
                body.dark-mode .notification-success {
                    background: #1e3a29;
                    color: #8fd9a8;
                }
                body.dark-mode .notification-info {
                    background: #1e3a3c;
                    color: #8fd0d9;
                }
            }
        </style>
    `;
    $('head').append(notificationStyles);

    // 初始化主题管理器
    window.themeManager = new ThemeManager();

    // 初始化应用
    window.englishApp = new EnglishApp();
}); 