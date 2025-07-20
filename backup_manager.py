# 資料版本備份與還原管理器
import json
import os
import shutil
from datetime import datetime
from typing import Dict, List, Optional

class BackupManager:
    def __init__(self, base_dir: str = '.'):
        self.base_dir = base_dir
        self.backup_dir = os.path.join(base_dir, 'backups')
        self.ensure_backup_dir()
        
        # 資料文件配置
        self.data_files = {
            'items': 'item_prices.json',
            'standard_prices': 'standard_prices.json',
            'customer_prices': 'customer_prices.json'
        }
    
    def ensure_backup_dir(self):
        """確保備份目錄存在"""
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
    
    def create_backup(self, backup_type: str = 'auto', description: str = '') -> str:
        """
        建立備份
        
        Args:
            backup_type: 'auto' 或 'manual'
            description: 備份描述
            
        Returns:
            備份ID
        """
        timestamp = datetime.now()
        backup_id = timestamp.strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join(self.backup_dir, backup_id)
        
        # 建立備份目錄
        os.makedirs(backup_path, exist_ok=True)
        
        # 複製所有資料文件
        backup_info = {
            'backup_id': backup_id,
            'timestamp': timestamp.isoformat(),
            'type': backup_type,
            'description': description,
            'files': {}
        }
        
        for data_type, filename in self.data_files.items():
            source_path = os.path.join(self.base_dir, filename)
            if os.path.exists(source_path):
                dest_path = os.path.join(backup_path, filename)
                shutil.copy2(source_path, dest_path)
                backup_info['files'][data_type] = {
                    'filename': filename,
                    'size': os.path.getsize(source_path),
                    'modified': datetime.fromtimestamp(os.path.getmtime(source_path)).isoformat()
                }
        
        # 儲存備份資訊
        info_path = os.path.join(backup_path, 'backup_info.json')
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(backup_info, f, ensure_ascii=False, indent=2)
        
        return backup_id
    
    def list_backups(self) -> List[Dict]:
        """列出所有備份"""
        backups = []
        
        if not os.path.exists(self.backup_dir):
            return backups
        
        for backup_id in os.listdir(self.backup_dir):
            backup_path = os.path.join(self.backup_dir, backup_id)
            if os.path.isdir(backup_path):
                info_path = os.path.join(backup_path, 'backup_info.json')
                if os.path.exists(info_path):
                    try:
                        with open(info_path, 'r', encoding='utf-8') as f:
                            backup_info = json.load(f)
                        backups.append(backup_info)
                    except Exception as e:
                        print(f"Error reading backup info for {backup_id}: {e}")
        
        # 按時間排序（最新的在前）
        backups.sort(key=lambda x: x['timestamp'], reverse=True)
        return backups
    
    def restore_backup(self, backup_id: str) -> bool:
        """
        還原備份
        
        Args:
            backup_id: 備份ID
            
        Returns:
            是否成功
        """
        backup_path = os.path.join(self.backup_dir, backup_id)
        
        if not os.path.exists(backup_path):
            return False
        
        try:
            # 在還原前先建立當前狀態的備份
            self.create_backup('auto', f'還原前自動備份 (還原到 {backup_id})')
            
            # 還原所有資料文件
            for data_type, filename in self.data_files.items():
                backup_file = os.path.join(backup_path, filename)
                if os.path.exists(backup_file):
                    dest_file = os.path.join(self.base_dir, filename)
                    shutil.copy2(backup_file, dest_file)
            
            return True
        except Exception as e:
            print(f"Error restoring backup {backup_id}: {e}")
            return False
    
    def delete_backup(self, backup_id: str) -> bool:
        """刪除備份"""
        backup_path = os.path.join(self.backup_dir, backup_id)
        
        if not os.path.exists(backup_path):
            return False
        
        try:
            shutil.rmtree(backup_path)
            return True
        except Exception as e:
            print(f"Error deleting backup {backup_id}: {e}")
            return False
    
    def cleanup_old_backups(self, keep_days: int = 90, keep_count: int = 50):
        """
        清理舊備份
        
        Args:
            keep_days: 保留天數
            keep_count: 最少保留數量
        """
        backups = self.list_backups()
        
        if len(backups) <= keep_count:
            return
        
        cutoff_date = datetime.now().timestamp() - (keep_days * 24 * 60 * 60)
        
        for backup in backups[keep_count:]:
            backup_time = datetime.fromisoformat(backup['timestamp']).timestamp()
            if backup_time < cutoff_date:
                self.delete_backup(backup['backup_id'])
    
    def get_backup_info(self, backup_id: str) -> Optional[Dict]:
        """獲取備份詳細資訊"""
        backup_path = os.path.join(self.backup_dir, backup_id)
        info_path = os.path.join(backup_path, 'backup_info.json')
        
        if not os.path.exists(info_path):
            return None
        
        try:
            with open(info_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None
