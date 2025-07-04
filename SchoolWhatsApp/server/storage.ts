import { students, messages, type Student, type InsertStudent, type Message, type InsertMessage, users, type User, type InsertUser } from "@shared/schema";
import { mongodb } from './mongodb';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export interface IStorage {
  // User methods (keeping from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Student methods
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentsByGrade(grade: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  searchStudents(query: string): Promise<Student[]>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: number, status: string): Promise<Message | undefined>;
}



// In-code permanent student storage as JSON array
let PERMANENT_STUDENTS_DATA: Student[] = [];

// Backup file storage path
const STUDENTS_DATA_FILE = path.join(process.cwd(), 'students-backup.json');

// Function to save students to both code and file
async function saveStudentsToStorage(students: Student[]): Promise<void> {
  try {
    // Update the in-memory permanent data
    PERMANENT_STUDENTS_DATA = [...students];
    
    // Also save to backup file
    const data = JSON.stringify(students, null, 2);
    await fs.writeFile(STUDENTS_DATA_FILE, data, 'utf-8');
    console.log(`Saved ${students.length} students to permanent storage`);
  } catch (error) {
    console.error('Error saving students to storage:', error);
  }
}

// Function to load students from storage
async function loadStudentsFromStorage(): Promise<Student[]> {
  try {
    // First try to load from in-code data
    if (PERMANENT_STUDENTS_DATA.length > 0) {
      return PERMANENT_STUDENTS_DATA.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    }
    
    // If no in-code data, try to load from backup file
    const data = await fs.readFile(STUDENTS_DATA_FILE, 'utf-8');
    const students = JSON.parse(data);
    PERMANENT_STUDENTS_DATA = students; // Update in-code data
    return students.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt)
    }));
  } catch (error) {
    // If no data found anywhere, return empty array
    return [];
  }
}

export class PermanentMemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentStudentId: number;
  private currentMessageId: number;
  private initialized: boolean = false;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentStudentId = 1;
    this.currentMessageId = 1;
  }

  private async initializeData() {
    if (this.initialized) return;
    
    // Load students from storage
    const savedStudents = await loadStudentsFromStorage();
    savedStudents.forEach(student => {
      this.students.set(student.id, student);
      if (student.id >= this.currentStudentId) {
        this.currentStudentId = student.id + 1;
      }
    });
    
    this.initialized = true;
    console.log(`Loaded ${savedStudents.length} students from permanent storage`);
  }

  private async saveStudents() {
    const students = Array.from(this.students.values());
    await saveStudentsToStorage(students);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    await this.initializeData();
    return Array.from(this.students.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    await this.initializeData();
    return this.students.get(id);
  }

  async getStudentsByGrade(grade: number): Promise<Student[]> {
    await this.initializeData();
    return Array.from(this.students.values()).filter(student => student.grade === grade);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    await this.initializeData();
    const id = this.currentStudentId++;
    const student: Student = {
      ...insertStudent,
      id,
      notes: insertStudent.notes || null,
      createdAt: new Date(),
    };
    this.students.set(id, student);
    await this.saveStudents();
    return student;
  }

  async updateStudent(id: number, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    await this.initializeData();
    const student = this.students.get(id);
    if (!student) {
      return undefined;
    }
    
    const updatedStudent: Student = { ...student, ...updateData };
    this.students.set(id, updatedStudent);
    await this.saveStudents();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    await this.initializeData();
    const result = this.students.delete(id);
    if (result) {
      await this.saveStudents();
    }
    return result;
  }

  async searchStudents(query: string): Promise<Student[]> {
    await this.initializeData();
    const lowerQuery = query.toLowerCase();
    return Array.from(this.students.values()).filter(student =>
      student.name.toLowerCase().includes(lowerQuery) ||
      student.studentId.toLowerCase().includes(lowerQuery) ||
      student.phone.includes(query) ||
      (student.notes && student.notes.toLowerCase().includes(lowerQuery))
    );
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      status: "pending",
      targetGrade: insertMessage.targetGrade || null,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageStatus(id: number, status: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) {
      return undefined;
    }
    
    const updatedMessage: Message = { ...message, status };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  private nextStudentId = 1;
  private nextMessageId = 1;
  private nextUserId = 1;

  constructor() {
    this.initializeCounters();
  }

  private async initializeCounters() {
    try {
      await mongodb.ensureConnection();
      
      // Get the highest IDs from collections to continue numbering
      const studentsCollection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const studentsCount = await studentsCollection.countDocuments();
      this.nextStudentId = studentsCount + 1;

      const messagesCollection = mongodb.getCollection<Message & { _id: ObjectId }>('messages');
      const messagesCount = await messagesCollection.countDocuments();
      this.nextMessageId = messagesCount + 1;

      const usersCollection = mongodb.getCollection<User & { _id: ObjectId }>('users');
      const usersCount = await usersCollection.countDocuments();
      this.nextUserId = usersCount + 1;

      console.log(`MongoDB Storage initialized - Students: ${studentsCount}, Messages: ${messagesCount}, Users: ${usersCount}`);
    } catch (error) {
      console.error('Failed to initialize MongoDB counters:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<User & { _id: ObjectId }>('users');
      const user = await collection.findOne({ id });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<User & { _id: ObjectId }>('users');
      const user = await collection.findOne({ username });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<User & { _id: ObjectId }>('users');
      const user: User = { ...insertUser, id: this.nextUserId++ };
      await collection.insertOne({ ...user, _id: new ObjectId() } as any);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const students = await collection.find({}).toArray();
      return students.map(({ _id, ...student }) => student);
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  async getStudent(id: number): Promise<Student | undefined> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const student = await collection.findOne({ id });
      if (!student) return undefined;
      const { _id, ...studentWithoutId } = student;
      return studentWithoutId;
    } catch (error) {
      console.error('Error getting student:', error);
      return undefined;
    }
  }

  async getStudentsByGrade(grade: number): Promise<Student[]> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const students = await collection.find({ grade }).toArray();
      return students.map(({ _id, ...student }) => student);
    } catch (error) {
      console.error('Error getting students by grade:', error);
      return [];
    }
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const student: Student = { 
        ...insertStudent, 
        id: this.nextStudentId++,
        notes: insertStudent.notes || null,
        createdAt: new Date()
      };
      await collection.insertOne({ ...student, _id: new ObjectId() } as any);
      console.log('Student saved to MongoDB:', student.name);
      return student;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(id: number, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const result = await collection.findOneAndUpdate(
        { id },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      if (!result) return undefined;
      const { _id, ...studentWithoutId } = result;
      return studentWithoutId;
    } catch (error) {
      console.error('Error updating student:', error);
      return undefined;
    }
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const result = await collection.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  async searchStudents(query: string): Promise<Student[]> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Student & { _id: ObjectId }>('students');
      const students = await collection.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { studentId: { $regex: query, $options: 'i' } },
          { phone: { $regex: query } },
          { notes: { $regex: query, $options: 'i' } }
        ]
      }).toArray();
      return students.map(({ _id, ...student }) => student);
    } catch (error) {
      console.error('Error searching students:', error);
      return [];
    }
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Message & { _id: ObjectId }>('messages');
      const messages = await collection.find({}).toArray();
      return messages.map(({ _id, ...message }) => message);
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Message & { _id: ObjectId }>('messages');
      const message: Message = { 
        ...insertMessage, 
        id: this.nextMessageId++,
        status: 'pending',
        createdAt: new Date(),
        targetGrade: insertMessage.targetGrade || null
      };
      await collection.insertOne({ ...message, _id: new ObjectId() } as any);
      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async updateMessageStatus(id: number, status: string): Promise<Message | undefined> {
    try {
      await mongodb.ensureConnection();
      const collection = mongodb.getCollection<Message & { _id: ObjectId }>('messages');
      const result = await collection.findOneAndUpdate(
        { id },
        { $set: { status } },
        { returnDocument: 'after' }
      );
      if (!result) return undefined;
      const { _id, ...messageWithoutId } = result;
      return messageWithoutId;
    } catch (error) {
      console.error('Error updating message status:', error);
      return undefined;
    }
  }
}

export const storage = new MongoStorage();
