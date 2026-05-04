export class CourseModel {
  constructor(subject, title, notes) {
    this.subject = subject;
    this.title = title;
    this.notes = notes;
    this.mainIdea = "";
    this.keywords = [];
    this.type = { isManagement: false, isHumanities: false };
    this.schema = "";
    this.relations = [];
    this.alerts = [];
    this.rules = [];
    this.applications = [];
    this.compression = [];
    this.reconstruction = [];
  }

  setMainIdea(idea) {
    this.mainIdea = idea;
    return this;
  }

  setKeywords(keywords) {
    this.keywords = keywords;
    return this;
  }

  setType(type) {
    this.type = type;
    return this;
  }

  setSchema(schema) {
    this.schema = schema;
    return this;
  }

  setRelations(relations) {
    this.relations = relations;
    return this;
  }

  setAlerts(alerts) {
    this.alerts = alerts;
    return this;
  }

  setRules(rules) {
    this.rules = rules;
    return this;
  }

  setApplications(applications) {
    this.applications = applications;
    return this;
  }

  setCompression(compression) {
    this.compression = compression;
    return this;
  }

  setReconstruction(reconstruction) {
    this.reconstruction = reconstruction;
    return this;
  }
}

export class SubjectProfile {
  constructor(subject) {
    this.subject = subject;
    this.isManagement = ["Comptabilité de gestion", "Finance", "Fiscalité", "Audit"].includes(subject);
    this.isHumanities = ["Philosophie", "Histoire", "Géographie", "Littérature", "Culture générale"].includes(subject);
    this.isMath = ["Mathématiques"].includes(subject);
  }
}