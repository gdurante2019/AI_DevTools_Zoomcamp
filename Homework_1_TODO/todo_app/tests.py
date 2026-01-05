from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import date, timedelta
from .models import Todo


class TodoModelTests(TestCase):
    """Test cases for the Todo model"""

    def test_create_todo_with_all_fields(self):
        """Test creating a todo with all fields populated"""
        todo = Todo.objects.create(
            title="Test Todo",
            description="Test Description",
            due_date=date.today(),
            is_resolved=False
        )
        self.assertEqual(todo.title, "Test Todo")
        self.assertEqual(todo.description, "Test Description")
        self.assertEqual(todo.due_date, date.today())
        self.assertFalse(todo.is_resolved)

    def test_todo_default_is_resolved(self):
        """Test that is_resolved defaults to False"""
        todo = Todo.objects.create(title="Test Todo")
        self.assertFalse(todo.is_resolved)

    def test_todo_optional_fields(self):
        """Test that description and due_date can be blank/null"""
        todo = Todo.objects.create(title="Test Todo")
        self.assertEqual(todo.description, "")
        self.assertIsNone(todo.due_date)

    def test_todo_string_representation(self):
        """Test that __str__ returns the title"""
        todo = Todo.objects.create(title="My Todo Item")
        self.assertEqual(str(todo), "My Todo Item")

    def test_todo_ordering(self):
        """Test that todos are ordered by most recent first"""
        todo1 = Todo.objects.create(title="First")
        todo2 = Todo.objects.create(title="Second")
        todo3 = Todo.objects.create(title="Third")

        todos = Todo.objects.all()
        self.assertEqual(todos[0], todo3)
        self.assertEqual(todos[1], todo2)
        self.assertEqual(todos[2], todo1)


class TodoListViewTests(TestCase):
    """Test cases for the todo list view"""

    def test_todo_list_view_with_no_todos(self):
        """Test list view displays correctly with no todos"""
        response = self.client.get(reverse('todo_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "No todos yet")
        self.assertQuerySetEqual(response.context['todos'], [])

    def test_todo_list_view_with_todos(self):
        """Test list view displays all todos"""
        Todo.objects.create(title="Todo 1", description="Description 1")
        Todo.objects.create(title="Todo 2", description="Description 2")

        response = self.client.get(reverse('todo_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Todo 1")
        self.assertContains(response, "Todo 2")
        self.assertEqual(len(response.context['todos']), 2)

    def test_todo_list_shows_resolved_status(self):
        """Test that resolved todos are displayed differently"""
        Todo.objects.create(title="Resolved Todo", is_resolved=True)

        response = self.client.get(reverse('todo_list'))
        self.assertContains(response, "Resolved")


class TodoCreateViewTests(TestCase):
    """Test cases for creating todos"""

    def test_create_todo_view_get(self):
        """Test GET request to create view displays form"""
        response = self.client.get(reverse('todo_create'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Create New Todo")

    def test_create_todo_valid_data(self):
        """Test creating a todo with valid data"""
        data = {
            'title': 'New Todo',
            'description': 'Test description',
            'due_date': date.today()
        }
        response = self.client.post(reverse('todo_create'), data)

        self.assertEqual(Todo.objects.count(), 1)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, 'New Todo')
        self.assertEqual(todo.description, 'Test description')
        self.assertRedirects(response, reverse('todo_list'))

    def test_create_todo_without_optional_fields(self):
        """Test creating a todo without description and due_date"""
        data = {'title': 'Simple Todo'}
        response = self.client.post(reverse('todo_create'), data)

        self.assertEqual(Todo.objects.count(), 1)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, 'Simple Todo')
        self.assertEqual(todo.description, '')
        self.assertIsNone(todo.due_date)

    def test_create_todo_without_title(self):
        """Test that form rejects submission without title"""
        data = {'description': 'No title'}
        response = self.client.post(reverse('todo_create'), data)

        self.assertEqual(Todo.objects.count(), 0)
        self.assertEqual(response.status_code, 200)


class TodoUpdateViewTests(TestCase):
    """Test cases for updating todos"""

    def test_update_todo_view_get(self):
        """Test GET request to update view displays form with existing data"""
        todo = Todo.objects.create(title="Original Title")
        response = self.client.get(reverse('todo_update', args=[todo.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Original Title")

    def test_update_todo_valid_data(self):
        """Test updating a todo with valid data"""
        todo = Todo.objects.create(title="Original Title")
        data = {
            'title': 'Updated Title',
            'description': 'Updated description',
            'due_date': date.today(),
            'is_resolved': True
        }
        response = self.client.post(reverse('todo_update', args=[todo.pk]), data)

        todo.refresh_from_db()
        self.assertEqual(todo.title, 'Updated Title')
        self.assertEqual(todo.description, 'Updated description')
        self.assertTrue(todo.is_resolved)
        self.assertRedirects(response, reverse('todo_list'))

    def test_update_nonexistent_todo(self):
        """Test updating a non-existent todo returns 404"""
        response = self.client.get(reverse('todo_update', args=[999]))
        self.assertEqual(response.status_code, 404)


class TodoDeleteViewTests(TestCase):
    """Test cases for deleting todos"""

    def test_delete_todo_view_get(self):
        """Test GET request to delete view displays confirmation"""
        todo = Todo.objects.create(title="Todo to Delete")
        response = self.client.get(reverse('todo_delete', args=[todo.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Todo to Delete")
        self.assertContains(response, "Are you sure")

    def test_delete_todo_post(self):
        """Test POST request deletes the todo"""
        todo = Todo.objects.create(title="Todo to Delete")
        response = self.client.post(reverse('todo_delete', args=[todo.pk]))

        self.assertEqual(Todo.objects.count(), 0)
        self.assertRedirects(response, reverse('todo_list'))

    def test_delete_nonexistent_todo(self):
        """Test deleting a non-existent todo returns 404"""
        response = self.client.post(reverse('todo_delete', args=[999]))
        self.assertEqual(response.status_code, 404)


class TodoToggleResolvedTests(TestCase):
    """Test cases for toggling todo resolved status"""

    def test_toggle_resolved_from_false_to_true(self):
        """Test toggling a pending todo to resolved"""
        todo = Todo.objects.create(title="Test Todo", is_resolved=False)
        response = self.client.get(reverse('todo_toggle', args=[todo.pk]))

        todo.refresh_from_db()
        self.assertTrue(todo.is_resolved)
        self.assertRedirects(response, reverse('todo_list'))

    def test_toggle_resolved_from_true_to_false(self):
        """Test toggling a resolved todo to pending"""
        todo = Todo.objects.create(title="Test Todo", is_resolved=True)
        response = self.client.get(reverse('todo_toggle', args=[todo.pk]))

        todo.refresh_from_db()
        self.assertFalse(todo.is_resolved)

    def test_toggle_nonexistent_todo(self):
        """Test toggling a non-existent todo returns 404"""
        response = self.client.get(reverse('todo_toggle', args=[999]))
        self.assertEqual(response.status_code, 404)


class TodoURLTests(TestCase):
    """Test cases for URL routing"""

    def test_todo_list_url_resolves(self):
        """Test that todo list URL resolves correctly"""
        url = reverse('todo_list')
        self.assertEqual(url, '/todos/')

    def test_todo_create_url_resolves(self):
        """Test that todo create URL resolves correctly"""
        url = reverse('todo_create')
        self.assertEqual(url, '/todos/create/')

    def test_todo_update_url_resolves(self):
        """Test that todo update URL resolves correctly"""
        url = reverse('todo_update', args=[1])
        self.assertEqual(url, '/todos/update/1/')

    def test_todo_delete_url_resolves(self):
        """Test that todo delete URL resolves correctly"""
        url = reverse('todo_delete', args=[1])
        self.assertEqual(url, '/todos/delete/1/')

    def test_todo_toggle_url_resolves(self):
        """Test that todo toggle URL resolves correctly"""
        url = reverse('todo_toggle', args=[1])
        self.assertEqual(url, '/todos/toggle/1/')


class TodoIntegrationTests(TestCase):
    """Integration tests for complete workflows"""

    def test_complete_todo_workflow(self):
        """Test complete workflow: create → edit → mark resolved → delete"""
        # Create
        create_data = {
            'title': 'Integration Test Todo',
            'description': 'Testing workflow',
            'due_date': date.today()
        }
        response = self.client.post(reverse('todo_create'), create_data)
        self.assertEqual(Todo.objects.count(), 1)
        todo = Todo.objects.first()

        # Edit
        update_data = {
            'title': 'Updated Todo',
            'description': 'Updated workflow',
            'due_date': date.today() + timedelta(days=1),
            'is_resolved': False
        }
        response = self.client.post(reverse('todo_update', args=[todo.pk]), update_data)
        todo.refresh_from_db()
        self.assertEqual(todo.title, 'Updated Todo')

        # Mark resolved
        response = self.client.get(reverse('todo_toggle', args=[todo.pk]))
        todo.refresh_from_db()
        self.assertTrue(todo.is_resolved)

        # Delete
        response = self.client.post(reverse('todo_delete', args=[todo.pk]))
        self.assertEqual(Todo.objects.count(), 0)

    def test_todo_without_due_date_displays_correctly(self):
        """Test that todos without due date display 'Not set'"""
        Todo.objects.create(title="No Due Date")
        response = self.client.get(reverse('todo_list'))
        self.assertContains(response, "Not set")

    def test_todo_without_description_displays_correctly(self):
        """Test that todos without description don't break display"""
        Todo.objects.create(title="No Description")
        response = self.client.get(reverse('todo_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "No Description")
