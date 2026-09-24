'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Task, TaskPriority, TaskStatus, User } from '@/types';

export default function Home() {
  const {
    user,
    token,
    loading: authLoading,
    demoUsers,
    googleProviderNotConfigured,
    setGoogleProviderNotConfigured,
    signInWithGoogle,
    switchDemoUser,
    signOut,
  } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for creating a task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [selectedDemoUser, setSelectedDemoUser] = useState('');

  // Show a simple alert message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Fetch tasks and users
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.getTasks(token, {
          status: statusFilter as any,
          filter: ownershipFilter as any,
        }),
        api.getUsers(token).catch(() => ({ users: [] })),
      ]);

      setTasks(tasksRes.tasks);
      if (usersRes.users && usersRes.users.length > 0) {
        setUsers(usersRes.users);
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Error loading tasks');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, ownershipFilter]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  // Handle task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showMessage('error', 'Please enter a task title');
      return;
    }

    if (!token) return;
    setSubmitting(true);

    try {
      const res = await api.createTask(token, {
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'pending',
        assigned_to: assignedTo || null,
        due_date: dueDate ? `${dueDate}T23:59:59Z` : null,
      });

      const assignee = users.find((u) => u.id === assignedTo);
      const emailNote = assignee
        ? ` (Email notification sent to ${assignee.email})`
        : '';

      showMessage('success', `Task "${res.task.title}" created successfully!${emailNote}`);

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignedTo('');
      setDueDate('');

      loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status update
  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (!token) return;
    try {
      await api.updateTask(token, task.id, { status: newStatus });
      if (newStatus === 'completed') {
        showMessage('success', `Task marked as Completed! (Email notification sent)`);
      } else {
        showMessage('success', `Task status changed to ${newStatus}`);
      }
      loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update status');
    }
  };

  // Handle delete
  const handleDeleteTask = async (task: Task) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    try {
      await api.deleteTask(token, task.id);
      showMessage('success', 'Task deleted successfully');
      loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to delete task');
    }
  };

  if (authLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  // 1. Logged Out View
  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ border: '2px solid #ccc', borderRadius: '8px', padding: '30px', backgroundColor: '#fff', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>Task Management Application</h1>
          <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>
            Hairdrama Tech Internship Assignment (Next.js + Flask + Supabase + Gmail)
          </p>

          <div style={{ marginBottom: '25px' }}>
            <button
              onClick={signInWithGoogle}
              style={{
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '15px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              Sign In with Google
            </button>
          </div>

          {/* Modal / Help box if Google OAuth is not enabled in Supabase */}
          {googleProviderNotConfigured && (
            <div
              style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeeba',
                padding: '15px',
                borderRadius: '4px',
                textAlign: 'left',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                ⚠️ Google Provider Not Enabled in Supabase Dashboard Yet
              </h4>
              <p style={{ margin: '0 0 8px 0' }}>
                Supabase reported: <code>Unsupported provider: provider is not enabled</code>.
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>To enable Google OAuth in Supabase:</strong>
              </p>
              <ol style={{ paddingLeft: '20px', margin: '0 0 10px 0' }}>
                <li>
                  Open your Supabase Providers:{' '}
                  <a
                    href="https://supabase.com/dashboard/project/qowzmhcydxxfbtrzangl/auth/providers"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0056b3', textDecoration: 'underline' }}
                  >
                    Click here to open Supabase Auth Providers
                  </a>
                </li>
                <li>Find <strong>Google</strong> and toggle <strong>Enable Google provider</strong> to ON.</li>
                <li>Enter your Google Cloud <strong>Client ID</strong> &amp; <strong>Client Secret</strong>.</li>
              </ol>
              <div style={{ borderTop: '1px solid #e2d19b', paddingTop: '8px' }}>
                <strong>Alternatively:</strong> You can use the <strong>Demo Test Login below</strong> right now to test creating and assigning tasks with email notifications!
              </div>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

          <div style={{ textAlign: 'left', backgroundColor: '#f9f9f9', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#444' }}>Or Login as Demo User for Testing:</h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
              Select a test account to test assigning tasks between users:
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={selectedDemoUser}
                onChange={(e) => setSelectedDemoUser(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
              >
                <option value="">-- Choose a user --</option>
                {demoUsers.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const target = demoUsers.find((u) => u.email === selectedDemoUser);
                  if (target) switchDemoUser(target);
                }}
                disabled={!selectedDemoUser}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged In Dashboard
  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 15px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#333',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Task Manager</h2>
          <span style={{ fontSize: '12px', color: '#ccc' }}>
            Logged in as: <strong>{user.full_name}</strong> ({user.email})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Switch User dropdown */}
          <div style={{ fontSize: '12px' }}>
            <span style={{ marginRight: '6px' }}>Switch:</span>
            <select
              value={user.email}
              onChange={(e) => {
                const found = demoUsers.find((u) => u.email === e.target.value);
                if (found) switchDemoUser(found);
              }}
              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '3px' }}
            >
              <option value={user.email}>{user.full_name} (Current)</option>
              {demoUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.full_name} ({u.email.split('@')[0]})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={signOut}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Alert message banner */}
      {message && (
        <div
          style={{
            padding: '10px 15px',
            marginBottom: '15px',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Task Creation Form */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '18px',
          backgroundColor: '#fdfdfd',
          marginBottom: '25px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          Create New Task
        </h3>

        <form onSubmit={handleCreateTask}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
              Task Title: *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement user registration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
              Description:
            </label>
            <textarea
              rows={2}
              placeholder="Enter task details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                Priority:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                Assign To: (Sends Gmail Notification)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
              >
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                Due Date:
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '7px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {submitting ? 'Creating Task...' : '+ Add Task'}
          </button>
        </form>
      </div>

      {/* Task List Section */}
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '18px', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            Task List ({tasks.length} total)
          </h3>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
            <div>
              <span style={{ marginRight: '5px' }}>Filter:</span>
              <select
                value={ownershipFilter}
                onChange={(e) => setOwnershipFilter(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                <option value="all">All Tasks</option>
                <option value="assigned_to_me">Assigned To Me</option>
                <option value="created_by_me">Created By Me</option>
              </select>
            </div>

            <div>
              <span style={{ marginRight: '5px' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '3px' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              onClick={loadData}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Task Table */}
        {loading && tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px', border: '1px dashed #ccc' }}>
            No tasks found. Use the form above to add a new task.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '10px 8px', border: '1px solid #ddd' }}>Title</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #ddd' }}>Description</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #ddd' }}>Priority</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #ddd' }}>Assigned To</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #ddd' }}>Due Date</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #ddd' }}>Status</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #ddd' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <tr
                      key={task.id}
                      style={{
                        backgroundColor: isDone ? '#f9fdf9' : '#fff',
                        borderBottom: '1px solid #ddd',
                      }}
                    >
                      {/* Title */}
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: isDone ? 'normal' : 'bold' }}>
                        <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#888' : '#000' }}>
                          {task.title}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '8px', border: '1px solid #ddd', color: '#555', maxWidth: '200px' }}>
                        {task.description || <span style={{ color: '#aaa' }}>-</span>}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '8px', border: '1px solid #ddd', textTransform: 'capitalize' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor:
                              task.priority === 'urgent'
                                ? '#ffcccc'
                                : task.priority === 'high'
                                ? '#ffe0b2'
                                : task.priority === 'medium'
                                ? '#fff3cd'
                                : '#d4edda',
                            color:
                              task.priority === 'urgent'
                                ? '#a00'
                                : task.priority === 'high'
                                ? '#b76e00'
                                : task.priority === 'medium'
                                ? '#856404'
                                : '#155724',
                          }}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Assigned To */}
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {task.assignee ? (
                          <span>
                            {task.assignee.full_name} <br />
                            <small style={{ color: '#888' }}>({task.assignee.email})</small>
                          </span>
                        ) : (
                          <span style={{ color: '#aaa' }}>Unassigned</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {task.due_date ? task.due_date.split('T')[0] : <span style={{ color: '#aaa' }}>-</span>}
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          style={{
                            padding: '4px 6px',
                            fontSize: '12px',
                            borderRadius: '3px',
                            border: '1px solid #ccc',
                            backgroundColor:
                              task.status === 'completed'
                                ? '#e8f5e9'
                                : task.status === 'in_progress'
                                ? '#e3f2fd'
                                : '#fff',
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          style={{
                            backgroundColor: '#ff4d4d',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Footer */}
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', color: '#999' }}>
        Hairdrama Tech Assignment • Simple Task Management Application
      </div>
    </div>
  );
}
