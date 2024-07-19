document.addEventListener('DOMContentLoaded', function() {
  // by default, load the inbox
  load_mailbox('inbox');

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#archive').addEventListener('click', () => arcEmail(email_id));
  document.querySelector('#unarchive').addEventListener('click', () => unarcEmail(email_id));

  // listen for submissions of form
  document.querySelector('form').onsubmit = function() {
      const data = new FormData(form)
      fetch(`/emails`, {
        method: 'POST',
        body: JSON.stringify({
            recipients: data.get('recipients'),
            subject: data.get('subject'),
            body: data.get('body'),
        })
      })
      .then(response => response.json())
      .then(result => {
        if(result.error) {
            document.querySelector('#messge').innerHTML = "Error: " + result.error
        }
        else {
            load_mailbox('sent')
        }
      })
      // catch errors and log to console
      .catch(error => {
        console.log('Error:', error.error);
      });
      // prevent default submission
      return false;
  }
})

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-list').style.display = 'none';
  document.querySelector('#oneEmail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#messge').innerHTML = '';
}

function reply_email(email) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emails-list').style.display = 'none';
    document.querySelector('#oneEmail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // clear out message field
    document.querySelector('#messge').innerHTML = '';

    // pre-fill composition fields
    document.querySelector('#compose-recipients').value = email.sender;
    // use regex to determine if email subject already says Re: then don't repeat it
    let text = email.subject;
    const pattern = /Re:/i;
    let result = pattern.test(text);
    if (result === true) {
        document.querySelector('#compose-subject').value = email.subject;
    }
    else {
        document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
    }
    // pre-fill body with timestamp and sender of original email
    document.querySelector('#compose-body').value = '\n\n\n' + 'On ' + email.timestamp + ', ' + email.sender + ' wrote: '  + '\n' + email.body;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-list').style.display = 'block';
  document.querySelector('#oneEmail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // get emails
  document.querySelector('#emails-list').innerHTML = "";
  email_id = 0;

  fetch(`/emails/${mailbox}`)
      .then(response => response.json())
      .then(emails => {
        if (emails.error) {
            console.log(emails.error)
            document.querySelector('#emails-view').innerHTML = "Error: " + emails.error;
        }
        else {
            emails.forEach(email => {
                // create separate div for each email
                const element = document.createElement('div');
                // show emails as read or unread
                if (email.read === true) {
                    element.style.backgroundColor = "lightgray"
                }
                else {
                    element.style.backgroundColor = "white";
                }
                // build each email
                element.innerHTML = `<p style="display:inline-block; width:20%;">${email.sender}</p><p style="width:50%;">${email.subject}</p><p>${email.timestamp}</p>`;

                // add event listener for clicking on an email
                element.addEventListener('click', function(e) {
                    document.querySelector('#oneEmail').style.display = 'block';
                    // show and hide buttons for different mailboxes
                    if (mailbox === 'inbox') {
                        document.querySelector('#email-buttons').style.display = 'block';
                        document.querySelector('#unarchive').style.display = 'none';
                    }
                    else if (mailbox === 'archive') {
                        document.querySelector('#email-buttons').style.display = 'none';
                        document.querySelector('#unarchive').style.display = 'block';
                    }
                    else if (mailbox === 'sent') {
                        document.querySelector('#email-buttons').style.display = 'none';
                        document.querySelector('#unarchive').style.display = 'none';
                    }
                    email_id = parseInt(email.id)
                    readEmail(email_id)
                });
                document.querySelector('#emails-list').append(element);
            })
        }
      })
      .catch(error => {
        console.log('Error:', error);
      });
}


function getEmail(email_id) {
    // show email detail view and hide other views
    document.querySelector('#email-detail').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emails-list').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // clear page
    document.querySelector('#email-detail').innerHTML = "";
    // get requested email to display
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        if (email.error) {
            document.querySelector('#email-body').style.display = 'none';
            document.querySelector('#email-detail').innerHTML = "Error: " + email.error;
        }
        else {
            // get recipients
            const myArr = Array.from(email.recipients);
            // create div to display email
            const element = document.createElement('div');
            element.innerHTML = `<p>From: ${email.sender}</p><p>To: ${myArr}</p><p>Subject: ${email.subject}</p><p>Timestamp: ${email.timestamp}</p><p style="margin-top:50px; white-space:pre-wrap;">${email.body}</p>`;
            document.querySelector('#email-detail').append(element);

            // add event listener for reply button
            document.querySelector('#reply').addEventListener("click", () => reply_email(email));
        }
    })
    // catch any errors and log to console
    .catch(error => {
        console.log('Error:', error);
    });
}

function readEmail(email_id) {
    // set email to read
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    })
    .then(response => {
        if (response.ok) {
            // get email to display
            getEmail(email_id)
        }
    })
    .catch(error => {
        console.error('Error:', error);
    })
}


function arcEmail(email_id) {
    // set email to archived
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    })
    .then(response => {
        if (response.ok) {
            // load inbox
            load_mailbox('inbox')
        }
    })
    .catch(error => {
        console.log('Error:', error);
    })
}

function unarcEmail(email_id) {
    // unarchive email
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false,
        })
    })
    .then(response => {
        if (response.ok) {
            // load inbox
            load_mailbox('inbox')
        }
    })
    .catch(error => {
        console.log("Error:", error);
    })
}



