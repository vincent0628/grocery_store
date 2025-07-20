// 備份管理模組
class BackupManager {
    constructor(app) {
        this.app = app;
        this.backups = [];
    }

    async fetchBackups() {
        try {
            const response = await fetch('/backups');
            const data = await response.json();
            this.backups = data;
            this.renderBackups();
        } catch (error) {
            console.error('Error fetching backups:', error);
        }
    }

    renderBackups() {
        const backupsDiv = document.getElementById('backups-list');
        if (!backupsDiv) return;
        
        backupsDiv.innerHTML = '';
        
        if (this.backups.length === 0) {
            backupsDiv.innerHTML = '<p class="no-backups">目前沒有備份紀錄</p>';
            return;
        }

        this.backups.forEach(backup => {
            const div = document.createElement('div');
            div.className = 'backup-item';
            
            const backupDate = new Date(backup.timestamp);
            const formattedDate = backupDate.toLocaleString('zh-TW');
            
            div.innerHTML = `
                <div class="backup-info">
                    <div class="backup-header">
                        <span class="backup-id">${backup.backup_id}</span>
                        <span class="backup-type ${backup.type}">${backup.type === 'auto' ? '自動' : '手動'}</span>
                    </div>
                    <div class="backup-details">
                        <div class="backup-date">${formattedDate}</div>
                        <div class="backup-description">${backup.description}</div>
                    </div>
                </div>
                <div class="backup-actions">
                    <button onclick="backupManager.restoreBackup('${backup.backup_id}')" class="restore-btn">還原</button>
                    <button onclick="backupManager.deleteBackup('${backup.backup_id}')" class="delete-backup-btn">刪除</button>
                </div>
            `;
            
            backupsDiv.appendChild(div);
        });
    }

    async createBackup() {
        const description = document.getElementById('backup-description').value.trim() || '手動備份';
        
        try {
            const response = await fetch('/backups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });
            
            const result = await response.json();
            if (result.success) {
                alert('備份建立成功！');
                document.getElementById('backup-description').value = '';
                this.fetchBackups();
            } else {
                alert('備份建立失敗！');
            }
        } catch (error) {
            console.error('Error creating backup:', error);
            alert('建立備份時發生錯誤！');
        }
    }

    async restoreBackup(backupId) {
        if (!confirm(`確定要還原到備份 "${backupId}" 嗎？\n\n這將會覆蓋目前的所有資料，並且會在還原前自動建立當前狀態的備份。`)) {
            return;
        }
        
        try {
            const response = await fetch(`/backups/${backupId}/restore`, {
                method: 'POST'
            });
            
            const result = await response.json();
            if (result.success) {
                alert('備份還原成功！頁面將重新載入以顯示還原後的資料。');
                // 重新載入頁面以顯示還原後的資料
                window.location.reload();
            } else {
                alert('備份還原失敗：' + (result.error || '未知錯誤'));
            }
        } catch (error) {
            console.error('Error restoring backup:', error);
            alert('還原備份時發生錯誤！');
        }
    }

    async deleteBackup(backupId) {
        if (!confirm(`確定要刪除備份 "${backupId}" 嗎？\n\n此操作無法復原。`)) {
            return;
        }
        
        try {
            const response = await fetch(`/backups/${backupId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                alert('備份刪除成功！');
                this.fetchBackups();
            } else {
                alert('備份刪除失敗：' + (result.error || '未知錯誤'));
            }
        } catch (error) {
            console.error('Error deleting backup:', error);
            alert('刪除備份時發生錯誤！');
        }
    }

    showBackupPanel() {
        const panel = document.getElementById('backup-panel');
        if (panel) {
            panel.style.display = 'block';
            this.fetchBackups();
        }
    }

    hideBackupPanel() {
        const panel = document.getElementById('backup-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
}

// 全域函數（為了向後兼容HTML中的onclick事件）
function createBackup() {
    backupManager.createBackup();
}

function showBackupPanel() {
    backupManager.showBackupPanel();
}

function hideBackupPanel() {
    backupManager.hideBackupPanel();
}
