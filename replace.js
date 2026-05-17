const fs = require('fs');
const files = [
    'src/components/ui/button.tsx',
    'src/components/layout/DashboardLayout.tsx',
    'src/app/user/dashboard/page.tsx',
    'src/app/admin/users/page.tsx',
    'src/app/admin/events/page.tsx',
    'src/app/admin/dashboard/page.tsx',
    'src/app/login/page.tsx'
];
files.forEach(f => {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/text-white/g, 'text-foreground').replace(/bg-background/g, 'bg-surface-50');
        fs.writeFileSync(f, content);
    }
});
