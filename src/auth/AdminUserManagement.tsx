import React, { useState, useEffect } from 'react';
import { Firestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { UserProfileData } from './types';
import { sendAuthEmail } from './emailClient';
import { Icons } from '../icons';

export interface AdminUserManagementProps {
  db: Firestore;
  onClose?: () => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ db, onClose }) => {
  const { config } = useAuth();
  const [usersList, setUsersList] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Invitar / Alta de Usuario
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(config.roles?.[0]?.id || 'Operator');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de Edición de Usuario
  const [editingUser, setEditingUser] = useState<UserProfileData | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const usersCollection = config.firestoreUsersCollection || 'users';
  const currentAppId = config.appId || config.appName;

  const defaultRoles = config.roles || [
    { id: 'Admin', label: 'Admin', description: 'Full access & user management' },
    { id: 'Management', label: 'Management', description: 'Access to Management Dashboard & Analytics' },
    { id: 'Operator', label: 'Operator', description: 'Operations, cases & disbursements management' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, usersCollection));
      const list: UserProfileData[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfileData);
      });
      setUsersList(list);
    } catch (e) {
      console.error('[AdminUserManagement] Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [db]);

  const handleCreateAndInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const tempId = `invited_${Date.now()}`;
      const userRef = doc(db, usersCollection, tempId);

      const invitedProfile: UserProfileData = {
        uid: tempId,
        email: newEmail.trim().toLowerCase(),
        displayName: newName.trim(),
        role: newRole,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        companyName: config.companyName,
        appId: currentAppId,
        allowedApps: [currentAppId],
        status: 'invited',
      };

      await setDoc(userRef, invitedProfile);

      const emailSent = await sendAuthEmail({
        emailServiceUrl: config.emailServiceUrl,
        recipientEmail: newEmail.trim(),
        recipientName: newName.trim(),
        actionLink: `${window.location.origin}?inviteEmail=${encodeURIComponent(newEmail.trim())}`,
        type: 'verification',
        projectConfig: {
          appName: config.appName,
          companyName: config.companyName,
          logoUrl: config.logoUrl,
          primaryColor: config.primaryColor,
        },
      });

      if (emailSent) {
        setFeedback({ type: 'success', text: `User ${newEmail} created. Activation email sent successfully.` });
        setNewEmail('');
        setNewName('');
        setShowAddModal(false);
        await fetchUsers();
      } else {
        setFeedback({ type: 'error', text: 'User was registered in Firestore but email delivery failed.' });
      }
    } catch (err: any) {
      console.error('[AdminUserManagement] Error creating user:', err);
      setFeedback({ type: 'error', text: err.message || 'Error processing user creation.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: UserProfileData) => {
    setEditingUser(u);
    setEditName(u.displayName || '');
    setEditRole(u.role || 'Operator');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    try {
      const userRef = doc(db, usersCollection, editingUser.uid);
      await updateDoc(userRef, {
        displayName: editName.trim(),
        role: editRole,
        updatedAt: new Date().toISOString(),
      });
      setFeedback({ type: 'success', text: `User ${editingUser.email} updated successfully.` });
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      console.error('[AdminUserManagement] Error updating user:', err);
      setFeedback({ type: 'error', text: err.message || 'Error updating user.' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteUser = async (targetUid: string, email: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove user ${email}?`);
    if (!confirmDelete) return;

    try {
      const userRef = doc(db, usersCollection, targetUid);
      await deleteDoc(userRef);
      setUsersList((prev) => prev.filter((u) => u.uid !== targetUid));
      setFeedback({ type: 'success', text: `User ${email} removed successfully.` });
    } catch (err: any) {
      console.error('[AdminUserManagement] Error deleting user:', err);
      setFeedback({ type: 'error', text: err.message || 'Error deleting user.' });
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      maxWidth: '1000px',
      width: '100%',
      margin: '0 auto',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            User Management & Access Control
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage users, permissions and platform access for <strong>{config.appName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: config.primaryColor || '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            {Icons.userPlus}
            <span>Add New User</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div style={{
          backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: feedback.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          {feedback.text}
        </div>
      )}

      {/* Search Filter */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by name or email address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: '14px' }}>
          Loading users...
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>USER</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>EMAIL</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>ASSIGNED ROLE</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const roleObj = defaultRoles.find((r) => r.id === u.role);
                const roleBadgeName = roleObj ? roleObj.label : (u.role || 'Admin');
                const isAdmin = roleBadgeName === 'Admin';

                return (
                  <tr key={u.uid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {u.displayName || 'No Name'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: isAdmin ? '#e0f2fe' : '#f1f5f9',
                        color: isAdmin ? '#0369a1' : '#334155',
                        border: `1px solid ${isAdmin ? '#bae6fd' : '#e2e8f0'}`,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {roleBadgeName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        backgroundColor: u.status === 'invited' ? '#fffbeb' : '#f0fdf4',
                        color: u.status === 'invited' ? '#b45309' : '#166534',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {u.status === 'invited' ? 'Pending Activation' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          title="Edit User"
                          onClick={() => openEditModal(u)}
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {Icons.edit}
                          <span>Edit</span>
                        </button>
                        <button
                          title="Delete User"
                          onClick={() => handleDeleteUser(u.uid, u.email)}
                          style={{
                            backgroundColor: '#fff1f2',
                            border: '1px solid #fecdd3',
                            color: '#e11d48',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '12px',
                          }}
                        >
                          {Icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add New User */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '18px' }}>
              Add New User
            </h3>

            <form onSubmit={handleCreateAndInviteUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@domain.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                  Assigned Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  {defaultRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.label} — {r.description}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    backgroundColor: config.primaryColor || '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Sending...' : 'Create & Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '18px' }}>
              Edit User ({editingUser.email})
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  {defaultRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.label} — {r.description}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    flex: 1,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{
                    flex: 1,
                    backgroundColor: config.primaryColor || '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
