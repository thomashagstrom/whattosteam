'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useState, type FormEvent } from 'react';

import { reportError } from '@/lib/friendly-errors';
import { getFirebase } from '@/lib/firebase';

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

/**
 * A working Firestore read/write to build from: each signed-in person has their
 * own notes, and `firestore.rules` lets them touch only those.
 */
export default function Notes({ uid }: { uid: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sorted here, not with orderBy(): a where() on uid plus an orderBy() on a
    // second field needs a composite index, and this starting point has none.
    const notesQuery = query(collection(getFirebase().db, 'notes'), where('uid', '==', uid));
    return onSnapshot(
      notesQuery,
      (snapshot) => {
        setError(null);
        setNotes(
          snapshot.docs
            .map((d) => {
              const data = d.data() as { text?: string; createdAt?: Timestamp | null };
              return {
                id: d.id,
                text: data.text ?? '',
                // A just-written note has no server timestamp yet.
                createdAt: data.createdAt?.toMillis() ?? Date.now(),
              };
            })
            .sort((a, b) => b.createdAt - a.createdAt),
        );
      },
      (e) => {
        reportError('notes', e);
        setError('We could not load your notes. Check your connection and try again.');
      },
    );
  }, [uid]);

  async function add(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    try {
      await addDoc(collection(getFirebase().db, 'notes'), {
        uid,
        text: value,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      reportError('notes', e);
      setError('We could not save that note. Please try again.');
    }
  }

  return (
    <Stack component="section" spacing={2} sx={{ maxWidth: 384 }}>
      <Stack component="form" onSubmit={add} direction="row" spacing={1}>
        <TextField
          label="Write a note"
          size="small"
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button type="submit" variant="contained">
          Add
        </Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <List dense disablePadding>
        {notes.map((note) => (
          <ListItem
            key={note.id}
            disableGutters
            secondaryAction={
              <Button
                size="small"
                aria-label={`Delete note: ${note.text}`}
                onClick={() => void deleteDoc(doc(getFirebase().db, 'notes', note.id))}
              >
                Delete
              </Button>
            }
          >
            <ListItemText primary={note.text} />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
