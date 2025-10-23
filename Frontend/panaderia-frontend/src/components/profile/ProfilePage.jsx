// src/components/profile/ProfilePage.jsx
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../auth/AuthContext";
import api from "../../services/api";

export default function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ nombre: user.nombre || user.first_name || user.username, email: user.email || "" });
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch("/api/usuarios/me/", form); // ajusta endpoint si necesario
      setUser(res.data);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div>Cargando perfil...</div>;

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl">
      <h3 className="text-xl font-semibold mb-4">Mi perfil</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Nombre</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border px-3 py-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border px-3 py-2 rounded w-full" />
        </div>
        <div className="flex gap-3">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="bg-amber-700 text-white px-4 py-2 rounded">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded border">Cancelar</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="bg-amber-700 text-white px-4 py-2 rounded">Editar</button>
          )}
        </div>
      </div>
    </div>
  );
}
