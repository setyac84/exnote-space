import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Building2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const RegisterCompany = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    name: '',
    email: '',
    password: '',
    position: '',
  });

  if (!user || user.company_id !== null) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <p className="text-muted-foreground">Only holding super admin can register new companies.</p>
      </div>
    );
  }

  const inputCls = 'w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  const handleSubmit = async () => {
    if (!form.company_name.trim() || !form.email.trim() || !form.password.trim() || !form.name.trim()) {
      toast.error('Company name, email, password, dan nama wajib diisi');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-company', { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Company "${data.company.name}" berhasil dibuat dengan super admin ${data.user.email}`);
      setForm({ company_name: '', name: '', email: '', password: '', position: '' });
    } catch (err: any) {
      toast.error(err.message || 'Gagal register company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Register Company</h1>
        <p className="text-sm text-muted-foreground mt-1">Buat company baru beserta super admin pertamanya</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6 space-y-5">
        
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Company Details</h3>
            <p className="text-xs text-muted-foreground">Info company yang akan didaftarkan</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Name *</label>
          <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
            className={inputCls} placeholder="e.g. PT Awesome Tech" />
        </div>

        <div className="flex items-center gap-3 pb-2 pt-2 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Super Admin Account</h3>
            <p className="text-xs text-muted-foreground">Akun super admin pertama untuk company ini</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} placeholder="Full name" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Position</label>
            <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              className={inputCls} placeholder="e.g. CEO" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={inputCls} placeholder="admin@company.com" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Password *</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={cn(inputCls, 'pr-10')} placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          <Building2 className="w-4 h-4" />
          {loading ? 'Creating...' : 'Register Company'}
        </button>
      </motion.div>
    </div>
  );
};

export default RegisterCompany;
